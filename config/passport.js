const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Client = require('../models/Client');
const Agent = require('../models/Agent');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    //console.log('Google profile:', profile);
    let user = await User.findOne({ email });
    console.log("user", user);

    const state = JSON.parse(req.query.state); // { role: "client" or "agent" } //we get it as query paramater from where we call the google auth :
    /*
        <!--Sign Up Using Google Button-->
        <div class="sm:col-span-2">
          <a href="http://localhost:5000/api/auth/google?role=client"
            class="flex w-full justify-center cursor-pointer  rounded-md bg-red-700 px-4 py-3 font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">Sign Up Using Google</a>
        </div>
    */
    console.log('State:', state);
    const role = state.role;

    if (!user) {
      user = new User({
        email,
        googleId: profile.id,
        role
      });
      await user.save();

      if (role === 'client') {

      const createdClient = await Client.create({
        user_id: user._id,
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        phone_number: '',
        location: ''
      });
      console.log('Created client:', createdClient);

      } else if (role === 'agent') {
        await Agent.create({
          user_id: user._id,
          company_name: profile.displayName,
          phone_number: '',
          location: '',
          opening_hours: ''
        });
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
