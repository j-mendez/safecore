import Channel from "mumble/lib/Channel";
import User from "mumble/lib/User";
import type { Channel as ChannelProps, Connection } from "mumble";
declare let MumbleData: any;
declare type User = {
    name?: string;
    pass?: string;
    channel?: {
        channel_id: number;
    } & ChannelProps;
};
declare class MumbleInstance {
    constructor();
    currentChannel: Channel;
    user: User;
    connection: Connection;
    resolve: (value: unknown) => void;
    onInit: (connection: any) => void;
    onVoice: (event: any) => void;
    connect: (props?: User) => Promise<void>;
    establish: (error: any, connection: Connection) => void;
}
export { MumbleInstance, MumbleData };
