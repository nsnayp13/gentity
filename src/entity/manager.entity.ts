@Entity()
class Manager {
    @OneToOne(() => User)
    @JoinColumn()
    user: OneToOne[];
}
