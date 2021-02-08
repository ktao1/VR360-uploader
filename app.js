const { response } = require('express')
var express = require('express')
const { google, oauth2_v2 } = require('googleapis')

const OAuth2Data = require('./credentials.json')

const multer = require('multer')
const fs = require('fs')
const path = require('path')
const { youtube } = require('googleapis/build/src/apis/youtube')
const cookieParser = require('cookie-parser')


// tile, description, tag of videos.
var title, description;
var tag = [];


// handle the autentication
const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
);

// set up the multer

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./videos");
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    },
});

var upload = multer({
    storage: Storage,
}).single("file"); //Field name and max count

// var Storage = multer.diskStorage({
//     destination: function (req, file, callback) {
//         callback(null, "./videos");
//         console.log(file);
//     },
//     filename: function (req, file, callback) {
//         callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
//         console.log(file);
//     },
// });

// var upload = multer({
//     storage: Storage,
// }).single("file"); //Field name and max count

var authed = false;
var videoID = ""; 
var chunk = "0:00 test1 0:10 test2 0:20 test3";

const scopes =
    "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile";

var app = express()

app.use(express.json());
app.use(cookieParser());


// set view engine
app.set("view engine", "ejs")
// set home route
app.get('/', (req, res) => {

    if (!authed) {
        var url = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes
        })

        res.render("index", { url: url })
    }
    else if (authed == true) {
        // user is authenticated
        var oauth2 = google.oauth2({
            version: 'v2',
            auth: oAuth2Client
        })

        oauth2.userinfo.get(function (err, response) {
            if (err) throw err
            
            var name = response.data.name
            var pic = response.data.picture
            //res.redirect('/uploadVideo');
            res.render("success")
        })
    }
})

app.get('/uploadVideo', (req, res) => {
    res.render("uploadVideo", {videoID: videoID, chunk: chunk});
})


//upload video
app.post("/upload", (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            // console.log(err);
            return res.end("Something went wrong");
        } else {
            console.log(req.body);

            /*
            // console.log(req.file.path);
            title = req.body.title;
            description = req.body.description;
            tags = req.body.tags;
            // console.log(title);
            // console.log(description);
            // console.log(tags);
            const youtube = google.youtube({ version: "v3", auth: oAuth2Client });
            // console.log(youtube)
            youtube.videos.insert(
                {
                    resource: {
                        // Video title and description
                        snippet: {
                            title: title,
                            description: description,
                            tags: tags
                        },
                        // I don't want to spam my subscribers
                        status: {
                            privacyStatus: "private",
                        },
                    },
                    // This is for the callback function
                    part: "snippet,status",

                    // Create the readable stream to upload the video
                    media: {
                        body: fs.createReadStream(req.file.path)
                    },
                },
                (err, data) => {
                    if (err) throw err
                    console.log(data)
                    console.log("Done.");
                    fs.unlinkSync(req.file.path);

                    posted = true;
                    videoID = data.data.id;
                    chunk = description;
                    console.log(videoID);
                    // var videoURL = "youtu.be/" + videoID
                    res.redirect('/uploadVideo');
                    // res.redirect('https://studio.youtube.com/channel/UCgAYgajBoM8zcVpLhkx0PvQ/videos/upload?filter=%5B%5D&sort=%7B%22columnType%22%3A%22date%22%2C%22sortOrder%22%3A%22DESCENDING%22%7D');
                }
            );

            // Display uploaded image for user validation
            //res.send(`You have uploaded this image: <hr/><vedio src="${req.file.path}" width="500"><hr /><a href="./">Upload another image</a>`);
            */
        }
    });
});

// app.get('/logout',(req,res) =>{
//     authed = false
//     res.redirect('/')
// })

app.get('/google/callback', (req, res) => {
    // excange code with access token
    const code = req.query.code
    if (code) {
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) throw err
            console.log("successfuly authenticated")
            oAuth2Client.setCredentials(tokens)
            authed = true
            res.redirect('/')
        })
    }
})

app.listen(3000, () => {
    console.log("App is listening on Port 3000")
})