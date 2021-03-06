Template.feed_new.onCreated(function() {
  this.searchQuery = new ReactiveVar('');
  this.filter = new ReactiveVar('all');
  this.limit = new ReactiveVar(20);
  this.postsCount = new ReactiveVar(0);

  
  this.autorun(() => {
    this.subscribe('posts.all', this.searchQuery.get(), this.filter.get(), this.limit.get());
    this.subscribe('users.all', this.searchQuery.get(), this.limit.get());
    this.postsCount.set(Counts.get('posts.all'));
  });
});

Template.feed_new.onRendered(() => {
  autosize($('[data-id=body]'));

  // Set submit button to disabled since text field is empty
  $('input[type=submit]').addClass('disabled');

  /*let currentUser = Meteor.users.findOne({_id: Meteor.userId()});
  
  //set max stake
  if (currentUser && currentUser.profile) {
    let userAddress = Meteor.users.findOne({_id: Meteor.userId()}).profile.publicKey;
    Coursetro.balanceOf(userAddress,function(error, result){
      if(!error)
          {
            $("#stake_val").attr("max",result);
          }
      else
          console.error(error);
    });
  }*/
});

Template.feed_new.helpers({
  posts: () => {
    const instance = Template.instance();
    if (instance.searchQuery.get()) {
      return Posts.find({}, { sort: [['score', 'desc']] });
    }
    return Posts.find({}, { sort: { createdAt: -1 } });
  },

  activeIfFilterIs: (filter) => {
    if (filter === Template.instance().filter.get()) {
      return 'active';
    }
  },

  hasMorePosts: () => {
    return Template.instance().limit.get() <= Template.instance().postsCount.get();
  },
  // Settings for autocomplete in post field
  settings: () => {
    return {
      position: 'bottom',
      limit: 5,
      rules: [{
        token: '@',
        collection: Meteor.users,
        field: 'username',
        template: Template.userList,
        filter: { _id: { $ne: Meteor.userId() }}
      }]
    };
  }
});


Template.feed_new.events({
  //claim free tokens
  'click [data-id=claim]': (event, template) => {

    let claim = Meteor.users.findOne({_id: Meteor.userId()}).claim;

    if(claim){
        Bert.alert('You have already got your free MRM tokens', 'danger', 'growl-top-right');
    }
    else{
      let userAddress = Meteor.users.findOne({_id: Meteor.userId()}).profile.publicKey;
      Coursetro.transfer(userAddress, '100',function(error, result){
        if(!error)
            {
              Meteor.call('users.claimed', (error, result) => {
                if (error) {
                  Bert.alert(error.reason, 'danger', 'growl-top-right');
                } else {
                  Bert.alert('100 MRM sent to your wallet!', 'success', 'growl-top-right');
                }
              });
            }
        else
            console.error(error);
      });
    }    
  },
/*
  'keyup [data-id=body]': (event, template) => {
    // If body section has text enable the submit button, else disable it
    if (template.find('[data-id=body]').value.toString().trim() !== '') {
      $('input[type=submit]').removeClass('disabled');
    } else {
      $('input[type=submit]').addClass('disabled');
    }

    // When shift and enter are pressed, submit form
    if (event.shiftKey && event.keyCode === 13) {
      $('[data-id=insert-post-form]').submit();
    }
  },

  'click [id=StakeSubmit]': (event, template) => {
    event.preventDefault();

    // Only continue if button isn't disabled
    if (!$('input[type=submit]').hasClass('disabled')) {
      let body = template.find('[data-id=body]').value;
      let stake_val = template.find("#stake_val").value;

      // If a user is mentioned in the post add span with class to highlight their username
      if(body.indexOf('@') !== -1) {
        for(let x = 0; x < body.length; x++) {
          if(body[x] === '@') {
            let u = body.slice(x + 1, body.indexOf(' ', x));
            let mentionedUser = Meteor.users.findOne({username: u});

            // If a valid user
            if(mentionedUser) {
              // Add opening and closing span tags
              body = body.slice(0, x) + '<a href="/users/' + mentionedUser._id + '">' + body.slice(x, body.indexOf(' ', x)) + '</a>' +
                     body.slice(body.indexOf(' ', x));

              // Increment by number of characters in opening span tag
              // so the same mention doesn't get evaluated multiple times
              x+= 16;
            }
          }
        }
      }

      Coursetro.transfer(MiramarAddress, stake_val,function(error, result){
        if(!error)
            {
              Bert.alert( stake_val+ ' MRM successfully staked!', 'success', 'growl-top-right');
            }
        else
            console.error(error);
      });

      Meteor.call('posts.insert', body, stake_val, (error, result) => {
        if (error) {
          Bert.alert(error.reason, 'danger', 'growl-top-right');
        } else {
          Bert.alert('Post successfully submitted', 'success', 'growl-top-right');
          template.find('[data-id=body]').value = '';
          template.find("#stake_val").value = '';
          $('[data-id=body]').css('height', '39px');
          $('input[type=submit]').addClass('disabled');
        }
      });
    }
  },*/

  'click [data-id=all]': (event, template) => {
    template.filter.set('all');
  },

  'click [data-id=following]': (events, template) => {
    template.filter.set('following');
  },

  'click [data-id=load-more]': (event, template) => {
    template.limit.set(template.limit.get() + 20);
  },

  'click [id=best]': (event, template) => {
    FlowRouter.go('/feed/best');
  },

  'click [id=new]': (event, template) => {
    FlowRouter.go('/feed/new');
  },

  'keyup [data-id=search-query]': _.debounce((event, template) => {
    event.preventDefault();
    template.searchQuery.set(template.find('[data-id=search-query]').value);
    template.limit.set(20);
  }, 300),

  'submit [data-id=search-posts-form]': (event, template) => {
    event.preventDefault();
  }
});

