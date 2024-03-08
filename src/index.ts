import { getToken, signIn, signOut } from "./utils/woffu";
import { CronJob, CronTime } from 'cron';

const log = (message: string) => {
    const date = new Date();
    console.log(`[${date.toISOString()}] ${message}`);
}


const generateCronRandomMinuteMaxMinSignIn = (maxMin: number) => {
    return Math.floor(Math.random() * 60) + " " + Math.floor(Math.random() * maxMin) + " 9 * * 1-5";
}

const generateCronRandomMinuteMaxMinSignOut = (maxMin: number) => {
    return Math.floor(Math.random() * 60) + " " + Math.floor((Math.random() * maxMin) + 20) + " 17 * * 1-5";
}

const getUsers = async () => {
    const usernames = process.env.WOFFU_USERNAME;
    const passwords = process.env.WOFFU_PASSWORD;
    const users = usernames.split(",");
    const pass = passwords.split(",");

    return users.map((user, index) => {
        return {
            username: user,
            password: pass[index]
        }
    });
}

(
    async () => {
        const users = await getUsers();
        for (const user of users) {
	    log(`Starting user ${user.username}`);
            // Sign in
            const signInCronJob = new CronJob(
                /* Cronjob every 9am working week */
                generateCronRandomMinuteMaxMinSignIn(15), // cronTime
                async (onComplete) => {
                    const token = await getToken(user.username, user.password);
                    const result = await signIn(token);
                    if (!result) {
                        log(`User ${user.username} is already signed in`);
                        return;
                    }
                    onComplete();
                }, // onTick
                async () => {
                    log(`User ${user.username} signed in`);
                    signInCronJob.setTime(new CronTime(generateCronRandomMinuteMaxMinSignIn(15), 'Europe/Madrid'));
                }, // onComplete
                true, // start
                'Europe/Madrid' // timeZone
            );
            // Sign out
            const signOutCronJob = new CronJob(
                /* Cronjob every 6pm working week */
                generateCronRandomMinuteMaxMinSignOut(15), // cronTime
                async (onComplete) => {
                    const token = await getToken(user.username, user.password);
                    const result = await signOut(token);
                    if (!result) {
                        log(`User ${user.username} is already signed out`);
                        return;
                    }
                    onComplete();
                }, // onTick
                async () => {
                    log(`User ${user.username} signed out`);
                    signOutCronJob.setTime(new CronTime(generateCronRandomMinuteMaxMinSignOut(15), 'Europe/Madrid'));
                }, // onComplete
                true, // start
                'Europe/Madrid' // timeZone
            );
        }
    }
)()
