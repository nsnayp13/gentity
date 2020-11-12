@Entity()
class Department {
    @ManyToOne(type => User, User => User.department)
    users: Type;
}
