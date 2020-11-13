@Entity()
class Test {
  name: string;

  @OneToMany(() => User, (user) => user.undefined)
  users: User[];

  @OneToOne(() => Director)
  @JoinColumn()
  director: Director;
}
