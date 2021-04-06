import type { Connection } from "mumble";
declare let MumbleData: any;
declare class MumbleInstance {
    constructor();
    client: any;
    connection: Connection;
    onInit: (connection: any) => void;
    onVoice: (event: any) => void;
    connect: (user?: string) => void;
    establish: (error: any, connection: Connection) => void;
}
export { MumbleInstance, MumbleData };
