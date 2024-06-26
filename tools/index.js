const functions = require("firebase-functions");
const {logger} = require("firebase-functions");
const axios = require("axios"); // For downloading image from URL
const sharp = require("sharp"); // For image resizing
const admin = require("firebase-admin");
const {onRequest} = require("firebase-functions/v2/https");
const https = require('https');
const querystring = require('querystring');
const closest_match = require('closest-match');

// Initialize Firebase Admin SDK
admin.initializeApp();
const storage = admin.storage(); // Access Firebase Storage


// Apparently this broke and I don't know how or when sometime 26th?
// I think its due to google cloud storage, saving actual photos to the bucket uses firestore
// other option is when thunkable saves a new image, it doesn't always create a new url?
exports.createThumbnail = functions.database
    .ref("/users/{userId}/picture")

    .onUpdate(async (snapshot, context) => {
      try {
        const userId = context.params.userId;
        logger.info(`Creating thumbnail for user ${userId}`);
        const pictureUrl = snapshot.val();

        // Download the image from the provided URL
        logger.info("Downloading image...");
        const response = await axios.get(pictureUrl,
            {responseType: "arraybuffer"});
        const imageBuffer = Buffer.from(response.data, "binary");

        // Resize the image to a thumbnail
        logger.info("Resizing image...");
        const thumbnailBuffer = await sharp(imageBuffer)
            .resize({width: 50, height: 50})
            .toBuffer();

        // Upload the thumbnail to Firebase Storage
        logger.info("Uploading thumbnail...");
        const bucket = storage.bucket();
        const file = bucket.file(`/users/${userId}/thumbnail/thumbnail.png`);
        await file.save(thumbnailBuffer,
            {
              metadata: {contentType: "image/png"},
            });

        // Get the URL of the uploaded thumbnail
        const [url] = await file.getSignedUrl(
            {action: "read", expires: "09-09-2024"});

        // Update the database with the thumbnail URL
        const userRef = admin.database().ref(`/users/${userId}`);
        await userRef.update({thumbnailUrl: url});
        logger.info("Thumbnail created and uploaded successfully.");
      } catch (error) {
        logger.error("Error creating thumbnail:", error);
      }
      logger.info("Function execution complete.");
      return null;
    });

// Follower notification -- WIP
exports.sendFollowNotification = functions.database
    .ref("/users/{userId}/followers/{followerId}")
    .onCreate(async (snapshot, context) => {
      try {
        const userId = context.params.userId;
        const followerId = context.params.followerId;
        logger.info(`Sending follow notification to user ${userId} 
            from follower ${followerId}`);
        // Get the user's device token from the database
        const userRef = admin.database().ref(`/users/${userId}`);
        const userSnapshot = await userRef.once("value");
        const user = userSnapshot.val();
        const deviceToken = user.deviceToken;
        // Send the notification to the user's device
        const followerProfile = await admin.auth.getUser(followerId);
        const message = {
          token: deviceToken,
          notification: {
            title: "New Follower",
            body: (followerProfile.username) +
                " is now following you.",
            image: followerProfile.thumbnailUrl,
          },
        };
        await admin.messaging().send(message);
        logger.info("Follow notification sent successfully.");
      } catch (error) {
        logger.error("Error sending follownotification:", error);
      }
      logger.info("Function execution complete.");
      return null;
    });


exports.getAllUsers = onRequest(async (req, res) => {
  try {
    const usernameOnly = req.query.usernameOnly === "true";
    const thumbnail = req.query.thumbnail === "true";
    const idOnly = req.query.idOnly === "true";
    const followers = req.query.followers === "true";
    const following = req.query.following === "true";
    const userId = req.query.userId;

    const usersRef = admin.database().ref("/users");
    const usersSnapshot = await usersRef.once("value");
    const users = usersSnapshot.val();
    res.set("Access-Control-Allow-Origin", "*");

    
    // Extract only the data from query string
    if (usernameOnly) {
      const usernames = Object.values(users).map((user) => user.username);
      res.status(200).json(usernames);
      logger.info(JSON.stringify(usernames));
    } 
    
    else if (thumbnail) {
      const thumbnails = Object.values(users).map((user) => user.thumbnailUrl);
      res.status(200).json(thumbnails);
      logger.info(JSON.stringify(thumbnails));
    } 
    
    else if (idOnly) {
      const userIds = Object.keys(users);
      res.status(200).json(userIds);
      logger.info(JSON.stringify(userIds));
    } 
    
    else if (following) {
      if (!userId || !users[userId]) {
        logger.warn("User not found or no following information available");
        logger.warn("User ID:", userId);
        logger.warn("User:", users[userId]);
        logger.warn("Following:", users[userId].following);
        return res.status(404).send("User not found or no following information available");
      }
      else if(!users[userId].hasOwnProperty("following")){
        return res.status(200).json(0);
      }
    const followingObj = users[userId].following;
    const numFollowing = Object.values(followingObj || {}).filter(value => value === true).length;
    res.status(200).json(numFollowing);
    logger.info("Number of following:", numFollowing);
    } 
    
    else if (followers) {
      if (!userId || !users[userId] ) {
        logger.warn("User not found or no followers information available");
        logger.warn("User ID:", userId);
        logger.warn("User:", users[userId]);
        logger.warn("Followers:", users[userId].followers);
        return res.status(404).send("User not found or no followers information available");
      }
      else if(!users[userId].hasOwnProperty("followers")){
        return res.status(200).json(0);
      }
    const followersObj = users[userId].followers;
    const numFollowers = Object.values(followersObj || {}).filter(value => value === true).length;
    res.status(200).json(numFollowers);
    logger.info("Number of followers:", numFollowers);
    }
    
    else {
      res.status(200).json(users);
      logger.info(JSON.stringify(users));
    }
  } 
  catch (error) {
    logger.error("Error retrieving users:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Spotify API
exports.getSpotifyToken = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");  //OPEN CORS ~ bad but needed for web app ~ just thunkable thingz
  try {

    logger.info("Fetching env variables");
    // Use Firebase environment variables to store client ID and secret
    const clientId = process.env.CLIENT_ID;
    logger.info('Client ID:', clientId);
    const clientSecret = process.env.CLIENT_SECRET;

    logger.info('Prepping request');
    // Prepare request body
    const requestBody = querystring.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    logger.info('Sending request');
    // get access token
    const tokenResponse = await new Promise((resolve, reject) => {
      const req = https.request('https://accounts.spotify.com/api/token', options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(JSON.parse(data));
          logger.info('Response:', data);
        });
      });

      req.on('error', (error) => {
        reject(error);
        logger.error('Error:', error);
      });

      req.write(requestBody);
      req.end();
    });

    const accessToken = tokenResponse.access_token;
    logger.info('Access token:', accessToken);
    res.status(200).json({ access_token: accessToken });
   
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

exports.returnNewReleases = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  try {
    // get token
    const token = req.query.token;
    logger.info('Token:', token);

    //spotift endpoint
    const url = 'https://api.spotify.com/v1/browse/new-releases?limit=10';

    //setup request
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    logger.info("sending request");
    //send request
    const newReleasesResponse = await new Promise((resolve, reject) => {
      const req = https.request(url, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          resolve(JSON.parse(data));
          logger.info('Response:', data);
        });
      });

      req.on('error', (error) => {
        reject(error);
        logger.error('Error:', error);
      });

      req.end();
    });
    logger.info("parsing response");
    //parse response
    const newReleases = newReleasesResponse.albums.items.map((album) => ({
      name: album.name,
      artist: album.artists[0].name,
      image: album.images.length > 0 ? album.images[0].url : null, // Singular album cover image
      url: album.external_urls.spotify
    }));
    logger.info('New Releases:', newReleases);
    // Return the parsed data
    return res.status(200).json(newReleases);

  }
catch (error) {
    logger.info('Error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

exports.getArtistData = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  try {
    // get token
    const token = req.query.token;
    const artistId = req.query.artistId;
    logger.info('Token:', token);
    logger.info('Artist ID:', artistId);

    // spotify endpoint
    const topTracksEndpoint = `https://api.spotify.com/v1/artists/${artistId}/top-tracks`;
    const artistEndpoint = `https://api.spotify.com/v1/artists/${artistId}`;
    const albumsEndpoint = `https://api.spotify.com/v1/artists/${artistId}/albums`;
    // setup request
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    // send request
    const albumsResponse = await new Promise((resolve, reject) => {
      const req = https.request(albumsEndpoint, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          resolve(JSON.parse(data));
          logger.info('Response:', data);
        });
      });

      req.on('error', (error) => {
        reject(error);
        logger.error('Error:', error);
      });

      req.end();
    });

    const artistResponse = await new Promise((resolve, reject) => {
      const req = https.request(artistEndpoint, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          resolve(JSON.parse(data));
          logger.info('Response:', data);
        });
      });
      
      req.on('error', (error) => {
        reject(error);
        logger.error('Error:', error);
      });

      req.end();
    });

    // parse response
    const albums = albumsResponse.items
      .filter((album) => album.album_type === "album")
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .slice(0, 10)
      .map((album) => ({
      albumName: album.name,
      releaseDate: album.release_date,
      image: album.images.length > 0 ? album.images[0].url : null,
      url: album.external_urls.spotify,
      popularity: album.popularity
      }));

    const artist = {
      name: artistResponse.name,
      image: artistResponse.images.length > 0 ? artistResponse.images[0].url : null,

    };

    // return parsed response
    logger.info('Top Tracks:', albums);
    logger.info('Artist:', artist);
    const combinedResponse = {
      albums: albums.sort((a, b) => b.popularity - a.popularity),
      artist: artist
    };
    logger.info('Combined Response:', combinedResponse);
    res.status(200).json(combinedResponse);
  }
  catch (error) {
    logger.error(error);
    res.status(500).send('Internal Server Error');
  }
});


exports.searchSpotify = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  try {
    // getting query parameters
    const token = req.query.token;
    const artist = req.query.artist;
    logger.info('Token:', token);
    logger.info('Artist:', artist);
    
    // spotify endpoint (could change this dynamically with query parameters)
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist`;

    // setting up HTTP request
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    // sending request
    const artistResponse = await new Promise((resolve, reject) => {
      const req = https.request(url, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          resolve(JSON.parse(data));
          logger.info('Response:', data);
        });
      });

      req.on('error', (error) => {
        reject(error);
        logger.error('Error:', error);
      });

      req.end();
    });

    // parsing response
    const artists = artistResponse.artists.items
      .filter((artist) => artist.popularity > 20)
      .map((artist) => ({
      id: artist.id,
      name: artist.name,
      img: artist.images.length > 0 ? artist.images[0].url : null,
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 9);

    // returning parsed response
    logger.info('Artists:', artists);
    res.status(200).json(artists);
  }
  catch (error) {
    logger.error(error);
    res.status(500).send('Internal Server Error');
  }
});

exports.getPosts = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  try {
    // set vars from query parameters
    const single = req.query.single === "true";
    const userId = req.query.userId;
    const replies = req.query.replies === "true";
    const postId = req.query.postId;

    // if there isn't a userId, return an error
    if (!userId && !replies) {
      logger.info('UserID parameter is required');
      return res.status(400).send('UserID parameter is required');
    }

    // if single is true, only return the user's posts
    if(single){
      logger.info('Fetching only own posts for user:', userId);
      // accessing RTDB
      const postsSnapshot = await admin.database().ref(`/posts/${userId}`).once('value');
      const userPosts = postsSnapshot.val();
      if (userPosts) {
      // Filter out the counter post
      const filteredPosts = Object.entries(userPosts).filter(([postId, post]) => postId !== 'counter');
      logger.info('Retrieved posts:', filteredPosts);
      const postsList = filteredPosts.map(([postId, post]) => ({
        postId,
        ...post
      }));
      return res.status(200).json(postsList);
      }
    }
    else if(replies){
      logger.info('Fetching replies for post:', postId);
      // accessing RTDB
      const repliesSnapshot = await admin.database().ref(`/posts/${userId}/${postId}/replies`).once('value');
      const postReplies = repliesSnapshot.val();
      if (postReplies) {
      // Filter out the counter post
      const filteredReplies = Object.entries(postReplies).filter(([replyId, reply]) => replyId !== 'counter');
      
      const replies = filteredReplies.map(([replyId, reply]) => ({
        reply: reply,
      }));
      logger.info('Retrieved replies:', replies);
      return res.status(200).json(replies);
      
      }
    }

    // else, return the posts of the users that the specified user is following
    logger.info('Fetching posts for user:', userId);

    // accessing RTDB to get the following object
    const followingSnapshot = await admin.database().ref(`/users/${userId}/following`).once('value');
    const following = followingSnapshot.val();

    // if there is no following object, return an error ~~~ could return better message for user
    if (!following) {
      logger.info('User not found:', userId);
      return res.status(404).send('User not found');
    }
    
    logger.info('Following:', following);

    // Filter out the users that the specified user is currently following (only true values)
    const followingUserIds = Object.keys(following).filter(followingUserId => following[followingUserId]);

    logger.info('Following User IDs:', followingUserIds);

    // Retrieve posts for each user the specified user is following
    const posts = [];
    for (const followingUserId of followingUserIds) {
      logger.info('Fetching posts for user:', followingUserId);
      const postsSnapshot = await admin.database().ref(`/posts/${followingUserId}`).once('value');
      const userPosts = postsSnapshot.val();
      if (userPosts) {
        // Filter out the counter post
        const filteredPosts = Object.entries(userPosts).filter(([postId, post]) => postId !== 'counter');
        // Add user ID to each post
        const postsWithUserId = filteredPosts.map(([postId, post]) => ({
          userId: followingUserId,
          postId,
          ...post
        }));
        posts.push(...postsWithUserId);
      }
    }
    // return the posts
    logger.info('Retrieved posts:', posts);
    
    return res.status(200).json(posts);
  } catch (error) {
    logger.info('Error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

exports.getCloseUsers = onRequest(async (req, res) => {
  try {
    const searchTerm = req.query.username;

    if (!searchTerm) {
      searchTerm = "";
    }
    // const maxDistanceThreshold = 2;  adjust to see how close we want
    const usersRef = admin.database().ref("/users");
    const usersSnapshot = await usersRef.once("value");
    const users = usersSnapshot.val();
    res.set("Access-Control-Allow-Origin", "*");

    const usernames = Object.values(users).map((user) => user.username);
    logger.info('All usernames:', usernames);

    //const filteredUsernames = usernames.filter(username => distance(searchTerm, username) <= maxDistanceThreshold);
    //logger.info('Filtered usernames:', filteredUsernames);

    const matchingUsernames = closest_match.closestMatch(searchTerm, usernames, true);
    logger.info('Matching usernames:', matchingUsernames);

    const matchingUserIds = Object.entries(users)
      .filter(([userId, user]) => matchingUsernames.includes(user.username))
      .map(([userId, user]) => userId);

    logger.info('Matching user IDs:', matchingUserIds);

    res.status(200).json(matchingUserIds);
    logger.info('Response sent:', matchingUserIds);
  } catch (error) {
    console.error("Error retrieving close users:", error);
    res.status(500).send("Internal Server Error");
  }
});