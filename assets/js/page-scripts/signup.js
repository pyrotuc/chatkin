(function (){

  var PAGE_NAME = 'signup';


  // Bail if this file isn't applicable.
  if ($('#'+PAGE_NAME).length === 0) { return; }

  // Get the initial randomized avatar color.
  var startingRed = (Math.floor(Math.random()*255));
  var startingGreen = (Math.floor(Math.random()*255));
  var startingBlue = (Math.floor(Math.random()*255));
  var startingColor = 'rgb('+startingRed+','+startingGreen+','+startingBlue+')';

  // Set up the Vue instance for our signup page
  var vm = new Vue({
    el: '#'+PAGE_NAME,

    data: {
      isSyncing: false,
      username: '',
      password: '',
      passwordConfirmation: '',
      errorType: '',//'usernameTaken', 'passwordMatch', catchall', or ''
      randomizedColor: startingColor
    },

    methods: {

      changeColor: function() {
        var red = (Math.floor(Math.random()*255));
        var green = (Math.floor(Math.random()*255));
        var blue = (Math.floor(Math.random()*255));

        vm.randomizedColor = 'rgb('+red+','+green+','+blue+')';
      },

      submitSignupForm: function() {
        vm.errorType = '';
        vm.isSyncing = true;

        if(vm.password !== vm.passwordConfirmation) {
          vm.isSyncing = false;
          vm.errorType = 'passwordMatch';
          return;
        }

        io.socket.put('/signup', {
          username: vm.username,
          password: vm.password,
          avatarColor: vm.randomizedColor
        }, function(data, jwr) {
          vm.isSyncing = false;
          if(jwr.error) {
            switch(jwr.headers['x-exit']) {

              case 'usernameAlreadyInUse':
                // Note that, if preferred, we could have also
                // just looked at the response's status code here;
                // i.e. 409 vs. 500.  In this example, we just use
                // the X-Exit header to demonstrate that it is available
                // when using actions2 on the server.
                vm.errorType = 'usernameTaken';
                return;

              default:
                vm.errorType = 'catchall';
                console.error('Server responded with an error.  (Please refresh the page and try again.)');
                console.error('Error details:');
                console.error(jwr.error);
                return;

            }
          }//-•

          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // IWMIH, the new account was created successfully and the current user's
          // browser session is now "logged in" (associated with their user record
          // in the database).
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

          // Now go ahead and redirect to the new user's personalized home page.
          window.location = '/';

        });//</ io.socket.put() >
      }

    }
  });


})();


