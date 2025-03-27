class UserService {

  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async createUser(userData) {
    const existingUser = await this.userRepository.findByEmail(userData.email);

    if (existingUser) {
      throw new Error('El email ya está en uso');
    }

    const user = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      department: userData.department
    };

    return await this.userRepository.save(user);
  }

  async getUserById(id) {

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  async updateUser(id, userData) {

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (userData.email && userData.email !== user.email) {

      const existingUser = await this.userRepository.findByEmail(userData.email);

      if (existingUser) {
        throw new Error('El email ya está en uso');
      }
    }

    const updatedUser = {
      ...user,
      ...userData
    };

    return await this.userRepository.update(updatedUser);
  }

  async deleteUser(id) {

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await this.userRepository.delete(id);
  }

  async getAllUsers() {
    return await this.userRepository.findAll();
  }
  async getUserByEmail(Email) {

    const user = await this.userRepository.findByEmail(Email);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }
}

module.exports = UserService;