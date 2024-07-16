require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
console.log('INSTAGRAM_APP_ID',INSTAGRAM_APP_ID);
console.log('INSTAGRAM_APP_SECRET',INSTAGRAM_APP_SECRET);
console.log('INSTAGRAM_REDIRECT_URI',INSTAGRAM_REDIRECT_URI);

app.get('/', (req, res) => {
  res.send('<a href="/auth/instagram">Login with Instagram</a>');
});

app.get('/auth/instagram', (req, res) => {
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
  res.redirect(authUrl);
});

app.get('/auth/instagram/callback', async (req, res) => {
  const { code } = req.query;
console.log('callback!!!!')
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', null, {
      params: {
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code,
      },
    });

    const { access_token, user_id } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`);
    const { username } = profileResponse.data;

    // Get user media
    const mediaResponse = await axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${access_token}`);
    const media = mediaResponse.data.data;

    res.json({ username, media });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred during authentication' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});