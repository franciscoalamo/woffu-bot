import axios from "axios";
import * as jwt from "jsonwebtoken";
const URL = process.env.WOFFU_URL;

export const getToken = async (username: string, password: string) => {
  const response = await axios.post(
    "https://app.woffu.com/token",
    new URLSearchParams({
      grant_type: "password",
      username,
      password,
    }),
    {
      headers: {
        authority: "app.woffu.com",
        accept: "application/json, text/plain, */*",
        "accept-language": "es-ES,es;q=0.9,en-XA;q=0.8,en;q=0.7,de;q=0.6",
        "cache-control": "no-cache",
        origin: "https://app.woffu.com",
        pragma: "no-cache",
        referer: "https://app.woffu.com/v2/login",
        "sec-ch-ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    }
  );
  return response.data.access_token;
};

export const signIn = async (token: string): Promise<boolean> => {
  let data = {
    TimezoneOffset: new Date().getTimezoneOffset(),
    UserId: getUserIdFromToken(token),
  };
  if (await isCurrentlySigned(token)) {
    console.log(
      `Skipping signin for user ${getUsernameFromToken(
        token
      )} because is already signed.`
    );
    return false;
  }

  if (await isHoliday(token)) {
    console.log(
      `Skipping signin for user ${getUsernameFromToken(
        token
      )} because today is a non-working day.`
    );
    return false;
  }

  await axios.post(`${URL}/api/signs`, data, buildAxiosOptionsWithToken(token));
  console.log(`${getUsernameFromToken(token)} signed in.`);
  return true;
};

export const signOut = async (token: string): Promise<boolean> => {
  let data = {
    TimezoneOffset: new Date().getTimezoneOffset(),
    UserId: getUserIdFromToken(token),
  };
  if (!(await isCurrentlySigned(token))) {
    console.log(
      `Skipping signout because user ${getUsernameFromToken(
        token
      )} is not signed.`
    );
    return false;
  }
  await axios.post(`${URL}/api/signs`, data, buildAxiosOptionsWithToken(token));
  console.log(`${getUsernameFromToken(token)} signed out.`);
  return true;
};

export const buildAxiosOptionsWithToken = (token: string) => {
  return {
    headers: {
      Authorization: `bearer ${token}`,
      "content-type": "application/json",
    },
  };
};

export const getUserIdFromToken = (token: string) => {
  return jwt.decode(token).UserId;
};

export const isHoliday = async (token: string) => {
  let today = new Date().toISOString().substring(0, 10);
  let url = `${URL}/api/users/${getUserIdFromToken(
    token
  )}/diaries/absence/single_events?fromDate=${today}&presence=false&toDate=${today}`;
  let response = await axios.get(url, buildAxiosOptionsWithToken(token));

  if (response.data.Events.length > 0 && response.data.Events[0].isDisabled) {
    console.log(`Non-working day found: ${response.data.Events}`);
    return true;
  }
  return false;
};

export const isCurrentlySigned = async (token: string) => {
  let signs = await axios.get(
    `${URL}/api/signs`,
    buildAxiosOptionsWithToken(token)
  );
  return signs.data.length > 0 && signs.data[signs.data.length - 1].SignIn;
};

export const getUsernameFromToken = (token: string) => {
  return jwt.decode(token).unique_name;
};
