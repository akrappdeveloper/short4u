import React, { useState, useEffect } from 'react'
import { Search, User, Video, FileText, Award } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

// Initialize Firebase (make sure to replace with your own config)
const firebaseConfig = {
  // Your Firebase configuration object goes here
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();

export default function FirebaseProfileAndSearch() {
  const [profileData, setProfileData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], reels: [], accounts: [] });

  useEffect(() => {
    // Fetch profile data
    const fetchProfileData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await firestore.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          // Fetch profile image URL
          const profileImageRef = storage.ref(`profile_images/${user.uid}`);
          const profileImageUrl = await profileImageRef.getDownloadURL();
          setProfileData({ ...userData, profileImage: profileImageUrl });
        }
      }
    };

    fetchProfileData();
  }, []);

  useEffect(() => {
    // Search functionality
    const performSearch = async () => {
      if (searchQuery) {
        const postsSnapshot = await firestore.collection('posts')
          .where('content', '>=', searchQuery)
          .where('content', '<=', searchQuery + '\uf8ff')
          .limit(10)
          .get();

        const reelsSnapshot = await firestore.collection('reels')
          .where('description', '>=', searchQuery)
          .where('description', '<=', searchQuery + '\uf8ff')
          .limit(10)
          .get();

        const accountsSnapshot = await firestore.collection('users')
          .where('displayName', '>=', searchQuery)
          .where('displayName', '<=', searchQuery + '\uf8ff')
          .limit(10)
          .get();

        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const reels = reelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setSearchResults({ posts, reels, accounts });
      } else {
        setSearchResults({ posts: [], reels: [], accounts: [] });
      }
    };

    performSearch();
  }, [searchQuery]);

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileData.profileImage} alt={profileData.displayName} />
              <AvatarFallback>{profileData.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl flex items-center">
                {profileData.displayName}
                {profileData.isVerified && (
                  <Badge variant="secondary" className="ml-2">
                    <Award className="w-4 h-4 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{profileData.username}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{profileData.bio}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <strong>Category:</strong> {profileData.category}
            </div>
            <div>
              <strong>Gender:</strong> {profileData.gender}
            </div>
            <div>
              <strong>Followers:</strong> {profileData.followers.toLocaleString()}
            </div>
            <div>
              <strong>Following:</strong> {profileData.following.toLocaleString()}
            </div>
          </div>
          <div>
            <strong>Posts:</strong> {profileData.posts.toLocaleString()}
          </div>
        </CardContent>
        <CardFooter>
          <Button>Follow</Button>
        </CardFooter>
      </Card>

      <div className="mb-8">
        <Input
          type="text"
          placeholder="Search posts, reels, and accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />
        <Tabs defaultValue="posts">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="reels">Reels</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            {searchResults.posts.map(post => (
              <Card key={post.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Post
                  </CardTitle>
                </CardHeader>
                <CardContent>{post.content}</CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="reels">
            {searchResults.reels.map(reel => (
              <Card key={reel.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Reel
                  </CardTitle>
                </CardHeader>
                <CardContent>{reel.description}</CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="accounts">
            {searchResults.accounts.map(account => (
              <Card key={account.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    {account.displayName}
                  </CardTitle>
                  <CardDescription>{account.username}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Avatar>
                    <AvatarImage src={account.profileImage} alt={account.displayName} />
                    <AvatarFallback>{account.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}