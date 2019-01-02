const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = 3000;
const BASE_URL = 'https://api.github.com/repos';

app.set('view engine','hbs');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname,'views')));

app.post('/repo', (req,res) => {
  const urlDetails = req.body.url.split('/');
  const repoOwner = urlDetails[3];
  const repoName = urlDetails[4];
  if(repoOwner && repoName) {
    var pullRequests = [];
    axios.get(`${BASE_URL}/${repoOwner}/${repoName}/pulls?open`).then((pulls) => {
      if(pulls.statusText !== 'Not Found') {
        for(let i = 0; i < pulls.data.length; i++) {
          var pullRequestMap = {};
          pullRequestMap.title = pulls.data[i].title;
          pullRequestMap.user = pulls.data[i].user.login;
          pullRequestMap.number = pulls.data[i].number;
          Promise.all(
            [
              axios.get(`${BASE_URL}/${repoOwner}/${repoName}/pulls/${pullRequestMap.number}/commits`),
              axios.get(`${BASE_URL}/${repoOwner}/${repoName}/issues/${pullRequestMap.number}/comments`)
            ]).then((results) => {
            //We have access to commits and comments here. Scope issue won't update hashmap... suggestions?
            pullRequestMap.commitCount = results[0].data.length;
            pullRequestMap.commentCount = results[1].data.length;
          }, (err) => {
              console.log(err);
          });
          pullRequests.push(pullRequestMap);
        }
      } else {
        res.render('error');
      }
    }).then(() => {
      res.render('repo-details' , {
        githubRepoURL: req.body.url,
        pullRequests
      });
    }).catch((err) => {
      console.log(err);
    })
  } else {
    res.render('error');
  }
})

app.get('/', (req,res) => {
  res.render('index');
})

app.listen(port , () => {
  console.log('listening on port ' , port);
});

module.export = app;
