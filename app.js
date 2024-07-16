require('dotenv').config();
const express = require('express');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const axios = require('axios');

const app = express();

// 세션 설정
app.use(session({ secret: 'your_session_secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'email'],
    scope: ['email',  'instagram_basic']
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

app.get('/', (req, res) => {
  res.send('<a href="/auth/facebook">Login with Facebook</a>');
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('callback !! res:',res)
    res.redirect('/profile');
  }
);

app.get('/profile', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }

  try {
    const response = await axios.get(`https://graph.facebook.com/v12.0/me/accounts?fields=instagram_business_account&access_token=${req.user.accessToken}`);
    const instagramAccountId = response.data.data[0].instagram_business_account.id;

    const mediaResponse = await axios.get(`https://graph.facebook.com/v12.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${req.user.accessToken}`);
    
    res.json({
      user: req.user,
      instagramMedia: mediaResponse.data
    });
  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram data' });
  }
});

const port = 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));