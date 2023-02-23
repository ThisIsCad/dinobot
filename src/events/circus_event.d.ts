interface CircusEvent {
    id: string;
    serverId: string;
    author: string?;
    authorId: string?;
    messageId: string?;
    title: string;
    description: string?;
    date: string?;
    time: string?;
    role_requirements: {
        tank: string?;
        healer: string?;
        dps: string?;
    };
    role_limits: {
        tank: number;
        healer: number;
        dps: number;

        group1: number;
        group2: number;
        group3: number;
        tentative: number;
        waitlist: number;
        notgoing: number;
    };
    signups: {
        tanks: { [key: string]: string };
        healers: { [key: string]: string };
        dps: { [key: string]: string };
        tank_subs: { [key: string]: string };
        healer_subs: { [key: string]: string };
        dps_subs: { [key: string]: string };

        group1: { [key: string]: string };
        group2: { [key: string]: string };
        group3: { [key: string]: string };
        tentative: { [key: string]: string };
        waitlist: { [key: string]: string };
        notgoing: { [key: string]: string };
    }
    quick_create: boolean;
    step: string;
    signup_status: 'open' | 'closed';
    template: 'swtor_raid' | 'generic_event' | 'lostark_raid' | 'scp_raid';
    open_signups_at: string?;
    published_channels: { [key: string]: string }
}
