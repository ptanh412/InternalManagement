export const KEY_TOKEN = "accessToken";

export const setToken = (token) => {
  localStorage.setItem(KEY_TOKEN, token);
};

export const getToken = () => {
  console.log("Fetching token");
  const token = localStorage.getItem(KEY_TOKEN);
  console.log("Retrieved token:", token);
  return token;
};

export const removeToken = () => {
  return localStorage.removeItem(KEY_TOKEN);
};
