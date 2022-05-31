use near_sdk::collections::LookupMap;
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::{UnorderedMap, UnorderedSet, Vector},
    env,
    json_types::U64,
    near_bindgen,
    serde::Serialize,
    AccountId, BorshStorageKey,
};

type PostId = u64;

const MAX_CONTENT_LEN: usize = 300;
const MAX_PAGE_SIZE: u64 = 100;

// storage keys
#[derive(BorshStorageKey, BorshSerialize)]
pub enum SK {
    Posts,

    UserPosts,
    UserPost { account_hash: Vec<u8> },

    Followings,
    FollowingUser { account_hash: Vec<u8> },

    Followers,
    FollowerUser { account_hash: Vec<u8> },
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Post {
    id: PostId,
    content: String,
    user: AccountId,
    created_at: u64, // use block timestamp, nanoseconds
}

impl Post {
    pub fn new(id: PostId, content: String, user: AccountId) -> Self {
        if content.len() > MAX_CONTENT_LEN {
            env::panic_str("content too long")
        }
        Post {
            id,
            content,
            user,
            created_at: env::block_timestamp(),
        }
    }
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    posts: Vector<Post>,
    user_posts: UnorderedMap<AccountId, Vector<PostId>>,

    followings: LookupMap<AccountId, UnorderedSet<AccountId>>,
    followers: LookupMap<AccountId, UnorderedSet<AccountId>>,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            posts: Vector::new(SK::Posts),
            user_posts: UnorderedMap::new(SK::UserPosts),
            followings: LookupMap::new(SK::Followings),
            followers: LookupMap::new(SK::Followers),
        }
    }
}

#[near_bindgen]
impl Contract {
    pub fn create_post(&mut self, content: String) -> Post {
        let id = self.posts.len();
        let user = env::signer_account_id();

        let post = Post::new(id, content, user.clone());
        self.posts.push(&post);

        let mut ups = self.user_posts.get(&user).unwrap_or_else(|| {
            Vector::new(SK::UserPost {
                account_hash: env::sha256(&user.as_bytes()),
            })
        });
        ups.push(&id);
        self.user_posts.insert(&user, &ups);

        post
    }

    // page start at 1, order by id desc
    pub fn public_timeline(&self, page: U64, page_size: U64) -> Vec<Post> {
        paged_vector(&self.posts, page, page_size)
    }

    // page start at 1, order by id desc
    pub fn user_timeline(&self, user: AccountId, page: U64, page_size: U64) -> Vec<Post> {
        if let Some(posts) = self.user_posts.get(&user) {
            return paged_vector(&posts, page, page_size)
                .iter()
                .map(|id| self.posts.get(*id).unwrap())
                .collect::<Vec<Post>>();
        }
        return vec![];
    }

    pub fn follow(&mut self, user: AccountId) {
        let me = env::signer_account_id();
        // following
        let mut followings = self.followings.get(&me).unwrap_or_else(|| {
            UnorderedSet::new(SK::FollowingUser {
                account_hash: env::sha256(&me.as_bytes()),
            })
        });
        followings.insert(&user);
        self.followings.insert(&me, &followings);

        // follower
        let mut followers = self.followers.get(&user).unwrap_or_else(|| {
            UnorderedSet::new(SK::FollowerUser {
                account_hash: env::sha256(&user.as_bytes()),
            })
        });
        followers.insert(&me);
        self.followers.insert(&user, &followers);
    }

    pub fn unfollow(&mut self, user: AccountId) {
        let me = env::signer_account_id();
        // following
        if let Some(mut followings) = self.followings.get(&me) {
            followings.remove(&user);
            self.followings.insert(&me, &followings);
        }

        // follower
        if let Some(mut followers) = self.followers.get(&user) {
            followers.remove(&me);
            self.followers.insert(&user, &followers);
        };
    }

    pub fn is_follow(&self, user1: AccountId, user2: AccountId) -> bool {
        if let Some(f) = self.followings.get(&user1) {
            return f.contains(&user2);
        }
        return false;
    }

    pub fn followings(&self, user: AccountId, page: U64, page_size: U64) -> Vec<AccountId> {
        if let Some(users) = self.followings.get(&user) {
            return paged_vector(users.as_vector(), page, page_size);
        }
        return vec![];
    }

    pub fn followers(&self, user: AccountId, page: U64, page_size: U64) -> Vec<AccountId> {
        if let Some(users) = self.followers.get(&user) {
            return paged_vector(users.as_vector(), page, page_size);
        }
        return vec![];
    }
}

// descending
fn paged_vector<T>(items: &Vector<T>, page: U64, page_size: U64) -> Vec<T>
where
    T: BorshDeserialize,
{
    if page_size.0 > MAX_PAGE_SIZE {
        env::panic_str(format!("page_size cannot exceed {}", MAX_PAGE_SIZE).as_str());
    }
    let raw_page = if page.0 == 0 { 1 } else { page.0 - 1 };
    let skipped = raw_page * page_size.0;

    if skipped >= items.len() {
        return vec![];
    }
    let start_idx = items.len() - skipped - 1;
    let mut result = Vec::with_capacity(page_size.0 as usize);
    for i in 0..page_size.0 {
        if start_idx < i as u64 {
            break;
        }

        if let Some(item) = items.get(start_idx - i) {
            result.push(item);
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, VMContext};

    use super::*;

    fn get_context() -> VMContext {
        VMContextBuilder::new()
            .signer_account_id("bob.near".parse().unwrap())
            .build()
    }

    #[test]
    fn test_create_post() {
        let context = get_context();
        testing_env!(context);
        let mut contract = Contract::default();
        let account: AccountId = "bob.near".parse().unwrap();

        let p1 = contract.create_post("hello post1".into());
        assert_eq!(p1.id, 0);
        assert_eq!(contract.posts.len(), 1);
        assert_eq!(contract.user_posts.len(), 1);
        assert_eq!(contract.user_posts.get(&account).unwrap().len(), 1);

        let p2 = contract.create_post("hello post2".into());
        assert_eq!(p2.id, 1);
        assert_eq!(contract.posts.len(), 2);
        assert_eq!(contract.user_posts.len(), 1);
        assert_eq!(contract.user_posts.get(&account).unwrap().len(), 2);
    }

    #[test]
    fn test_timeline() {
        let context = get_context();
        testing_env!(context);
        let mut contract = Contract::default();

        let posts = contract.public_timeline(0.into(), 10.into());
        assert!(posts.is_empty());
        let posts = contract.public_timeline(1.into(), 10.into());

        assert!(posts.is_empty());

        for i in 0..13 {
            contract.create_post(format!("post {}", i));
        }
        assert_eq!(contract.posts.len(), 13);

        let total_page = 7u64;
        let page_size: U64 = 3.into();

        for i in 1..total_page {
            let posts = contract.public_timeline(i.into(), page_size);
            println!("public timeline page {}", i);
            for post in posts {
                println!("  post: {:?}", post)
            }
        }

        for i in 1..total_page {
            let posts = contract.user_timeline("bob.near".parse().unwrap(), i.into(), page_size);
            println!("user_timeline page {}", i);
            for post in posts {
                println!("  post: {:?}", post)
            }
        }
    }

    #[test]
    fn test_follow() {
        let context = get_context();
        testing_env!(context);
        let me: AccountId = "bob.near".parse().unwrap();
        let user: AccountId = "alice.near".parse().unwrap();

        let mut contract = Contract::default();

        contract.follow(user.clone());

        let followings = contract.followings.get(&me).unwrap();
        assert_eq!(followings.len(), 1);
        assert!(followings.contains(&user));

        let followers = contract.followers.get(&user).unwrap();
        assert_eq!(followers.len(), 1);
        assert!(followers.contains(&me));

        // test interface

        let user2: AccountId = "user2.near".parse().unwrap();

        contract.follow(user2.clone());
        let followings = contract.followings(me.clone(), 1.into(), 100.into());
        assert_eq!(followings.len(), 2);
        // descending
        assert_eq!(followings[0], user2.clone());
        assert_eq!(followings[1], user.clone());

        let followers = contract.followers(me.clone(), 1.into(), 100.into());
        assert_eq!(followers.len(), 0);

        let followers = contract.followers(user.clone(), 1.into(), 100.into());
        assert_eq!(followers.len(), 1);
        assert_eq!(followers[0], me.clone());

        // unfollow
        contract.unfollow(user.clone());
        let followings = contract.followings(me.clone(), 1.into(), 100.into());
        assert_eq!(followings.len(), 1);
        // descending
        assert_eq!(followings[0], user2.clone());

        let followers = contract.followers(user.clone(), 1.into(), 100.into());
        assert_eq!(followers.len(), 0);
    }
}
