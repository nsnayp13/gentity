@Entity()
class Director {
    @OneToOne(() => User)
    @JoinColumn()
    user: User[];
}
