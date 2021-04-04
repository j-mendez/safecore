interface User {
    id: number;
    value: number;
    name: string;
}
declare type AppProps = {
    error?: Error;
    data?: User[];
};
export { User, AppProps };
