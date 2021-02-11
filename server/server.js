const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userController = require('./controllers/userController');
const cookieController = require('./controllers/cookieController');
const sessionController = require('./controllers/sessionController');
const projectController = require('./controllers/projectController');

const app = express();

const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV === 'development';

app.use(express.json());
app.use(cookieParser());

// enable cors
// options: origin: allows from localhost when in dev or the app://rse when using prod, credentials: allows credentials header from origin (needed to send cookies)
app.use(
  cors({
    origin: ['http://localhost:8080', 'app://rse'],
    credentials: true
  })
);

// TODO: github Oauth still needs debugging
// on initial login, redirect back to app is not working correctly when in production environment
// subsequent logins seem to be working fine, however

// initializes passport and passport sessions
// app.use(passport.initialize());
// app.use(passport.session());


// // for Oauth which is currently not working
// app.get(
//   '/github/callback',
//   sessionController.gitHubResponse,
//   sessionController.gitHubSendToken,
//   userController.createUser,
//   userController.verifyUser,
//   cookieController.setSSIDCookie,
//   sessionController.startSession,
//   (req, res) => {
//     if (isDev) {
//       return res.status(200).redirect(`http://localhost:8080?=${res.locals.ssid}`);
//     } else {
//       return res.status(200).redirect('app://rse');
//     }
//   }
// );

app.post(
  '/signup',
  userController.createUser,
  cookieController.setSSIDCookie,
  sessionController.startSession,
  (req, res) => {
    return res.status(200).json({ sessionId: res.locals.ssid });
  }
);

app.post(
  '/login',
  userController.verifyUser,
  cookieController.setSSIDCookie,
  sessionController.startSession,
  (req, res) => {
    return res.status(200).json({ sessionId: res.locals.ssid });
  }
);

// user must be logged in to get or save projects, otherwise they will be redirected to login page
app.post(
  '/saveProject',
  sessionController.isLoggedIn,
  projectController.saveProject,
  (req, res) => {
    return res.status(200).json(res.locals.savedProject);
  }
);

app.post(
  '/getProjects',
  sessionController.isLoggedIn,
  projectController.getProjects,
  (req, res) => {
    return res.status(200).json(res.locals.projects);
  }
);

app.delete(
  '/deleteProject',
  sessionController.isLoggedIn,
  projectController.deleteProject,
  (req, res) => {
    return res.status(200).json(res.locals.deleted);
  }
);

// catch-all route handler
app.use('*', (req, res) => {
  return res.status(404).send('Page not found');
});

// Global error handler
app.use((err, req, res, next) => {
  console.log('invoking global error handler');
  const defaultErr = {
    log: 'Express error handler caught unknown middleware',
    status: 500,
    message: { err: 'An error occurred' }
  };

  const errorObj = Object.assign({}, defaultErr, err);
  return res.status(errorObj.status).json(errorObj.message);
});

// starts server on PORT
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.export = PORT;
