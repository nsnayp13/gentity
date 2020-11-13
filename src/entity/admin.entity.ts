@Entity()
class ADmin {
    @OneToOne(() => User)
    @JoinColumn()
    user: Type;
}
