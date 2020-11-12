@Entity()
class Category {
  @ManyToOne((type) => User, (User) => User.category)
  static: [];
}
