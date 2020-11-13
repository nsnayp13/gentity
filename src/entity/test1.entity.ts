@Entity()
class Test1 {
  @ManyToMany(() => User)
  @JoinTable()
  umtm: User[];

  @ManyToOne((type) => User, (user) => user.uoto)
  umto: User;
}
