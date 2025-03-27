class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  async createUser(req, res) {
    try {

      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);

    } catch (error) {

      res.status(400).json({ error: error.message });

    }
  }

  async getUserById(req, res) {
    try {

      const user = await this.userService.getUserById(req.params.id);
      res.json(user);

    } catch (error) {

      res.status(404).json({ error: error.message });

    }
  }

  async updateUser(req, res) {
    try {

      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json(user);

    } catch (error) {

      res.status(400).json({ error: error.message });

    }
  }

  async deleteUser(req, res) {
    try {

      await this.userService.deleteUser(req.params.id);
      res.status(204).send();

    } catch (error) {

      res.status(400).json({ error: error.message });

    }
  }

  async getAllUsers(req, res) {
    try {

      const users = await this.userService.getAllUsers();
      res.json(users);

    } catch (error) {

      res.status(400).json({ error: error.message });

    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          error: "Usuario no encontrado"
        });
      }

      //const passwordMatch = await bcrypt.compare(password, user.password); // Por si encriptamos las contraseñas mas adelante
      if (user.password !== password) {
        return res.status(401).json({
          error: "Contraseña incorrecta"
        });
      } else {
        req.session.user = { user_id: user.id, role: user.role };
      }

      res.status(200).json({
        message: "OK", user: { user_id: req.session.user.user_id, role: req.session.user.role }
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }

  async logout(req, res) {
    req.session.reset();
    return res.json({
      message: 'Closed session'
    });

  }
}

module.exports = UserController;