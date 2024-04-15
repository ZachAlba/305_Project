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


// OPEN CORS ~ bad but needed for web app ~ just thunkable thingz
// doesnt really matter for most of the functions but spotify makes me nervous

// Apparently this broke and I don't know how or when sometime 26th?
// I think its due to google cloud storage, saving actual photos to the bucket uses firestore
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

// catch all endpoint, depending on query returns various user data
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

// Spotify API - WIP
exports.getSpotifyData = onRequest(async (req, res) => {
  try {
    // Check if the request is authenticated
    if (!req.user) {
      return res.status(403).send('Unauthorized');
    }

    // res.set("Access-Control-Allow-Origin", "*");  OPEN CORS ~ bad but needed for web app ~ just thunkable thingz

    // Use Firebase environment variables to store client ID and secret
    const clientId = functions.config().spotify.client_id;
    const clientSecret = functions.config().spotify.client_secret;

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

    // get access token
    const tokenResponse = await new Promise((resolve, reject) => {
      const req = https.request('https://accounts.spotify.com/api/token', options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });

    const accessToken = tokenResponse.access_token;

    // Spotify API endpoint URL
    var spotifyUrl = 'https://api.spotify.com/v1/';

    // Which endpoint to use
    if (req.query.type === 'search') {
      spotifyUrl += 'search';
    } else if (req.query.type === 'albums') {
      spotifyUrl += 'albums';
    } else if (req.query.type === 'artists') {
      spotifyUrl += 'artists';
    } else if (req.query.type === 'tracks') {
      spotifyUrl += 'tracks';
    } else {
      return res.status(400).send('Bad Request');
    }

    // Make a request to the Spotify API using the access token
    const spotifyResponse = await new Promise((resolve, reject) => {
      const req = https.get(spotifyUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }, (spotifyRes) => {
        let data = '';

        spotifyRes.on('data', (chunk) => {
          data += chunk;
        });

        spotifyRes.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });

    res.send(spotifyResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// get data from posts branch
exports.getPosts = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  try {
    const userId = req.query.userId;
    if (!userId) {
      logger.info('UserID parameter is required');
      return res.status(400).send('UserID parameter is required');
    }
    
    logger.info('Fetching posts for user:', userId);

    // Retrieve the list of UserIDs that the specified user is following
    const followingSnapshot = await admin.database().ref(`/users/${userId}/following`).once('value');
    const following = followingSnapshot.val();

    if (!following) {
      logger.info('User not found:', userId);
      return res.status(404).send('User not found');
    }
    
    logger.info('Following:', following);

    // Filter out the users that the specified user is following
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

    logger.info('Retrieved posts:', posts);
    
    return res.status(200).json(posts);
  } catch (error) {
    logger.info('Error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// uses levenstein distance to find closest usernames
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