import { useEffect, useState } from "react";
import {
  urlClient,
  LENS_HUB_CONTRACT_ADDRESS,
  queryRecommendedProfiles,
  queryExplorePublications,
} from "./queries";
import LENSHUB from "./lenshub";
import { ethers } from "ethers";
import { Box, Button, Image } from "@chakra-ui/react";

function App() {
  const [account, setAccount] = useState(null); // If the account is logged-in then account address wil be stored here if not logged-in then it will show `null`
  const [profiles, setProfiles] = useState([]); // So, when we call lens we want to grab the profiles and the information that lens can provide us but before that
  console.log("~profiles", profiles);
  const [posts, setPosts] = useState([]); // for grabbing lens feed or posts
  console.log("~posts", posts);

  // from here onwards we will create some async functions that will help us in `signing-in`, `getting the recommended profiles`, `getting the posts`, `following user accounts`...
  // so here we would use `async functions`...to wait for asynchronous calls which requires calling something outside of the client/frontend as in our case we are calling for blockchain data...

  async function signIn() {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts", // this will allow us to have metamask call the blockchain to make sure we're able to sign in to the website
    });
    setAccount(accounts[0]); // for getting/grabbing the first account address
  }

  async function getRecommendedProfiles() {
    const response = await urlClient
      .query(queryRecommendedProfiles)
      .toPromise(); // this will allow us to grab the recommended profiles
    const profiles = response.data.recommendedProfiles.slice(0, 5); // first 5 recommended profiles starting from `0` till `5` (i.e 0,1,2,3,4)
    setProfiles(profiles);
  }

  // Similar to twitter feed
  async function getPosts() {
    const response = await urlClient
      .query(queryExplorePublications)
      .toPromise();

    const posts = response.data.explorePublications.items.filter((post) => {
      if (post.profile) return post;
      return "";
    }); // here we are filtering posts on the basis of- whether the post have a profile or not
    setPosts(posts);
  }

  // for following the user
  async function follow(id) {
    // In above `getRecommendedProfiles()` and `getPosts()` we are just grabbing data from Blockchain but here we want to interact with the Blockchain...
    // So, we call the contract as `following a user-profile` needs signing a transaction and could cost gas. Hence we need `LENS_HUB_CONTRACT_ADDRESS`, `LENS_HUB` and `provides`...
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(
      LENS_HUB_CONTRACT_ADDRESS,
      LENSHUB,
      provider.getSigner()
    );
    // This will `allow` us to sign the transaction so we can `follow the user`...
    // but if we have a setup properly which we will do in more full fledged Social Media project in that scenario we can have `Token` for that will allow us to follow and do all of the above and other related processes for free...
    const tx = await contract.follow([parseInt(id)], [0x0]); // here `id` is the `userId` that we want to follow and we want to make sure it to be a number by passing it through `parseInt()`
    await tx.wait();
  }

  useEffect(() => {
    // As when the app-loads we want to call the below two functions
    getRecommendedProfiles();
    getPosts();
  }, []);

  // below function goes into the `posts.profiles` to find the `ImageUrl`
  const parseImageUrl = (profile) => {
    if (profile) {
      const url = profile.picture?.original?.url; // here checking ` if 'profile.picture' is true then move into '.original' and if it's true then go grab the 'url' `
      //checking `url` one more time so as to grab it correctly
      if (url && url.startsWith("ipfs:")) {
        // checking whether the `url` starts with `ipfs` (i.e as URL will look like `ipfs://QmPEHmeskwN8aEjGduD1e8EhXnZmM3fvW16JVkPjHtCJMf`) or not
        const ipfsHash = url.split("//")[1]; // here spliting the url into 2 which will look like `['ipfs:', 'QmPEHmeskwN8aEjGduD1e8EhXnZmM3fvW16JVkPjHtCJMf']` and selecting the element at index `1` i.e `ipfsHash`
        return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`; // here appending the ipfs hash with a pinning service gateway basically an `apiGateway` to get the image continuously without any lag
      }

      return url;
    }

    return "/default-avatar.png"; // if image url don't exist then use this default `png` image
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <Box width="100%" backgroundColor="rgba(5, 32, 64, 28)">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="55%"
          margin="auto"
          color="white"
          padding="10px 0"
        >
          <Box>
            <Box
              fontFamily="DM Serif Display"
              fontSize="44px"
              fontStyle="italic"
            >
              DeSocial
            </Box>
            <Box> Decentralized Social Media App</Box>
          </Box>
          {account ? (
            <Box backgroundColor="#000" padding="15px" borderRadius="6px">
              Connected
            </Box>
          ) : (
            <Button
              onClick={signIn}
              color="rgba(5,32,64)"
              _hover={{ backgroundColor: "#808080" }}
            >
              Connect
            </Button>
          )}
        </Box>
      </Box>

      {/* CONTENT */}
      <Box
        display="flex"
        justifyContent="space-between"
        width="55%"
        margin="35px auto auto auto"
        color="white"
      >
        {/* POSTS */}
        <Box width="65%" maxWidth="65%" minWidth="65%">
          {posts.map((post) => (
            <Box
              key={post.id}
              marginBottom="25px"
              backgroundColor="rgba(5, 32, 64, 28)"
              padding="40px 30px 40px 25px"
              borderRadius="6px"
            >
              <Box display="flex">
                {/* PROFILE IMAGE */}
                <Box width="75px" height="75px" marginTop="8px">
                  <img
                    alt="profile"
                    src={parseImageUrl(post.profile)}
                    width="75px"
                    height="75px"
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null; // prevents looping
                      currentTarget.src = "/default-avatar.png";
                    }}
                  />
                </Box>

                {/* POST CONTENT */}
                <Box flexGrow={1} marginLeft="20px">
                  <Box display="flex" justifyContent="space-between">
                    <Box fontFamily="DM Serif Display" fontSize="24px">
                      {post.profile?.handle}
                    </Box>
                    <Box height="50px" _hover={{ cursor: "pointer" }}>
                      <Image
                        alt="follow-icon"
                        src="/follow-icon.png"
                        width="50px"
                        height="50px"
                        onClick={() => follow(post.id)}
                      />
                    </Box>
                  </Box>
                  <Box
                    overflowWrap="anywhere" // for wrapping the content around if the post-content is too large
                    fontSize="14px"
                  >
                    {post.metadata?.content}
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        {/* FRIEND SUGGESTIONS */}
        <Box
          width="30%"
          backgroundColor="rgba(5, 32, 64, 28)"
          padding="40px 25px"
          borderRadius="6px"
          height="fit-content"
        >
          <Box fontFamily="DM Serif Display">FRIEND SUGGESTIONS</Box>
          <Box>
            {profiles.map((profile, i) => (
              <Box
                key={profile.id}
                margin="30px 0"
                display="flex"
                alignItems="center"
                height="40px"
                _hover={{ color: "#808080", cursor: "pointer" }}
              >
                <img
                  alt="profile"
                  src={parseImageUrl(profile)}
                  width="40px"
                  height="40px"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = "/default-avatar.png";
                  }}
                />
                <Box marginLeft="25px">
                  <h4>{profile.name}</h4>
                  <p>{profile.handle}</p>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </div>
  );
}

export default App;
