const router = require('express').Router();
const { User, Post, Comment } = require('../../models');

router.get('/', async (req, res) => {
  try {
    const userData = await User.findAll({
      attributes: { exclude: ['password'] },
    });
    res.status(200).json(userData);
  } catch (err) {
    res.status(400).json(err);
  }
});

// Return all posts authored by this userid
router.get('/:id', async (req, res) => {
  try {
    const userData = await User.findOne({
      attributes: { exclude: ['password'] },
      where: { id: req.params.id },
      include: [
        {
          model: Post,
          attributes: ['id', 'title', 'content', 'created_at'],
        },
        {
          model: Comment,
          attributes: ['id', 'comment_text', 'created_at'],
          include: {
            model: Post,
            attributes: ['title'],
          },
        },
        {
          model: Post,
          attributes: ['title'],
        },
      ],
    });
    console.log(userData);
    if (!userData) {
      res.status(404).json({ message: `No such user id ${req.params.id}` });
      return;
    }
    res.status(200).json(userData);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post('/', async (req, res) => {
  try {
    const userData = await User.create(req.body);
    console.table(req.body);
    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.username = userData.username;
      req.session.logged_in = true;
      res
        .status(201)
        .json({ message: `Successfully created ${userData.username}` });
    });
  } catch (err) {
    res.status(400).json(err);
    //
    // future work - would like like to capture the error and provide some context
    //
  }
});

router.post('/login', async (req, res) => {
  try {
    const userData = await User.findOne({
      where: { username: req.body.username },
    });
    if (!userData) {
      // res.status(400).json({ message: `${userData.username} does not exist` });
      res
        .status(400)
        .json({ message: `${req.body.username} is not a valid username` });
      return;
    }

    const validPassword = await userData.checkPassword(req.body.password);

    if (!validPassword) {
      res.status(400).json({ message: 'Incorrect password, please try again' });
      return;
    }

    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.username = userData.username;
      req.session.logged_in = true;

      res.json({ user: userData, message: 'You are now logged in!' });
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post('/logout', async (req, res) => {
  try {
    if (req.session.logged_in) {
      const userData = await req.session.destroy(() => {
        res.status(204).end();
      });
    } else {
      res.status(404).end();
      // somehow you're attempted to logout a session that doesn't exist.
      // This might be because the session timeed out and then the user attempted to log out.
    }
  } catch {
    res.status(400).end();
    // you'd get here if there was a session found but the destroy failed / super rare
  }
});

module.exports = router;
