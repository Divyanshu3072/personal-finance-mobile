import { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, FlatList, Alert, ActivityIndicator, TextInput, Modal, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { deleteAccount, addAccount, updateAuthMe, addCategory, updateCategory, deleteCategory } from '../src/utils/api';
import { useData } from '../src/context/DataContext';

export default function Profile() {
  const router = useRouter();
  const { logout, token } = useAuth();
  
  const {
    accounts,
    categories,
    userProfile,
    isInitializing,
    isRefreshing,
    forceRefresh,
    refreshAccounts,
    refreshCategories,
    refreshUserProfile,
    refreshFailed
  } = useData();

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);

  // Bank Form
  const [newBankName, setNewBankName] = useState('');
  const [newBankBalance, setNewBankBalance] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  // Profile Form
  const [userName, setUserName] = useState(userProfile?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Category Form
  const [catName, setCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);

  if (isInitializing || !token) {
    return (
      <View className="flex-1 bg-notion-bg items-center justify-center">
        <ActivityIndicator size="large" color="#37352F" />
      </View>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleLongPress = (id: string, name: string) => {
    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount(id);
              await refreshAccounts();
            } catch (e) {
              Alert.alert("Error", "Could not delete account.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      await updateAuthMe({ name: userName.trim() });
      await refreshUserProfile();
      Alert.alert("Success", "Profile updated.");
    } catch (e) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCatLongPress = (id: string, name: string) => {
    Alert.alert(
      "Category Actions",
      `Manage category: ${name}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => {
            setEditingCatId(id);
            setCatName(name);
            setCatModalVisible(true);
          }
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(id);
              await refreshCategories();
            } catch (e: any) {
              const msg = e.response?.data?.message || "Could not delete category.";
              Alert.alert("Error", msg);
            }
          }
        }
      ]
    );
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      Alert.alert("Error", "Category name cannot be empty.");
      return;
    }
    setSavingCat(true);
    try {
      if (editingCatId) {
        await updateCategory(editingCatId, catName.trim());
      } else {
        await addCategory({ name: catName.trim() });
      }
      setCatModalVisible(false);
      setCatName('');
      setEditingCatId(null);
      await refreshCategories();
    } catch (e: any) {
      const msg = e.response?.data?.error || e.response?.data?.message || "Could not save category.";
      Alert.alert("Error", msg);
    } finally {
      setSavingCat(false);
    }
  };

  const handleAddBank = async () => {
    if (!newBankName || !newBankBalance) return;
    setSavingBank(true);
    try {
      await addAccount({ name: newBankName, startingBalance: Number(newBankBalance) });
      setModalVisible(false);
      setNewBankName('');
      setNewBankBalance('');
      await refreshAccounts();
    } catch (e) {
      Alert.alert("Error", "Could not add account.");
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-notion-bg">
      <FlatList
        data={accounts}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={forceRefresh} />}
        ListHeaderComponent={
          <>
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-3xl font-bold text-notion-text">Profile</Text>
              <Pressable onPress={handleLogout}>
                <Text className="text-notion-gray font-medium">Log Out</Text>
              </Pressable>
            </View>

            {refreshFailed && (
              <View className="bg-red-100 rounded-lg p-3 mb-6 border border-red-200">
                <Text className="text-red-600 text-xs text-center font-medium">Could not refresh. Showing saved data.</Text>
              </View>
            )}

            {/* Top Half: User Details */}
            <View className="mb-10 p-6 border border-notion-border rounded-xl bg-white shadow-sm">
              <Text className="text-xs font-bold text-notion-gray mb-4 uppercase tracking-widest">User Information</Text>
              
              <Text className="text-sm font-bold text-notion-text mb-2">Email</Text>
              <TextInput 
                className="w-full border border-notion-border rounded-lg px-4 py-3 mb-4 bg-notion-bg text-notion-gray"
                value={userProfile?.email || ''}
                editable={false}
              />

              <Text className="text-sm font-bold text-notion-text mb-2">Name</Text>
              <TextInput 
                className="w-full border border-notion-border rounded-lg px-4 py-3 mb-6 bg-white text-notion-text focus:border-notion-text"
                placeholder="Your Name"
                defaultValue={userProfile?.name || ''}
                onChangeText={setUserName}
              />
              
              <Pressable 
                onPress={handleUpdateProfile}
                disabled={savingProfile}
                className={`bg-notion-text py-3 rounded-lg items-center ${savingProfile ? 'opacity-50' : 'active:opacity-80'}`}
              >
                {savingProfile ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Save Profile</Text>}
              </Pressable>
            </View>

            <Text className="text-xs font-bold text-notion-gray mb-4 uppercase tracking-widest">Bank Accounts</Text>
          </>
        }
        renderItem={({ item }) => (
          <Pressable 
            onLongPress={() => handleLongPress(item.id, item.name)}
            className="flex-row justify-between items-center p-4 border border-notion-border rounded-xl bg-white mb-3 shadow-sm active:opacity-80"
          >
            <View>
              <Text className="text-notion-text font-bold text-base">{item.name}</Text>
              <Text className="text-notion-gray text-xs mt-1">Long-press to delete</Text>
            </View>
            <Text className="text-notion-text font-bold">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(item.startingBalance))}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            <Pressable 
              onPress={() => setModalVisible(true)}
              className="py-4 border border-notion-border border-dashed rounded-xl items-center active:opacity-80 mt-2 mb-10"
            >
              <Text className="text-notion-gray font-bold text-lg">+ Add New Bank Account</Text>
            </Pressable>

            <Text className="text-xs font-bold text-notion-gray mb-4 uppercase tracking-widest">Categories</Text>
            {categories.map((cat: any) => (
              <Pressable 
                key={cat.id}
                onLongPress={() => handleCatLongPress(cat.id, cat.name)}
                className="flex-row justify-between items-center p-4 border border-notion-border rounded-xl bg-white mb-3 shadow-sm active:opacity-80"
              >
                <View>
                  <Text className="text-notion-text font-bold text-base capitalize">{cat.name}</Text>
                  <Text className="text-notion-gray text-xs mt-1">Long-press to manage</Text>
                </View>
              </Pressable>
            ))}

            <Pressable 
              onPress={() => {
                setEditingCatId(null);
                setCatName('');
                setCatModalVisible(true);
              }}
              className="py-4 border border-notion-border border-dashed rounded-xl items-center active:opacity-80 mt-2"
            >
              <Text className="text-notion-gray font-bold text-lg">+ Add Category</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-notion-bg p-6">
          <View className="flex-row justify-between items-center mb-8 mt-4">
            <Text className="text-2xl font-bold text-notion-text">Add Bank Account</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text className="text-notion-gray font-medium">Cancel</Text>
            </Pressable>
          </View>
          
          <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Bank Name</Text>
          <TextInput
            className="text-xl font-medium text-notion-text mb-8 py-2 border-b border-notion-border/50"
            placeholder="e.g. Checking"
            value={newBankName}
            onChangeText={setNewBankName}
            autoFocus
          />

          <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Starting Balance</Text>
          <TextInput
            className="text-xl font-medium text-notion-text mb-12 py-2 border-b border-notion-border/50"
            placeholder="0.00"
            keyboardType="numeric"
            value={newBankBalance}
            onChangeText={setNewBankBalance}
          />

          <Pressable 
            onPress={handleAddBank}
            disabled={savingBank || !newBankName || !newBankBalance}
            className={`bg-notion-text py-4 rounded-xl items-center ${(savingBank || !newBankName || !newBankBalance) ? 'opacity-50' : 'active:opacity-80'}`}
          >
            {savingBank ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Add Account</Text>}
          </Pressable>
        </SafeAreaView>
      </Modal>

      {/* Category Modal */}
      <Modal visible={catModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCatModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-notion-bg p-6">
          <View className="flex-row justify-between items-center mb-8 mt-4">
            <Text className="text-2xl font-bold text-notion-text">
              {editingCatId ? 'Edit Category' : 'Add Category'}
            </Text>
            <Pressable onPress={() => setCatModalVisible(false)}>
              <Text className="text-notion-gray font-medium">Cancel</Text>
            </Pressable>
          </View>
          
          <Text className="text-xs font-bold text-notion-gray mb-2 uppercase tracking-widest">Category Name</Text>
          <TextInput
            className="text-xl font-medium text-notion-text mb-12 py-2 border-b border-notion-border/50"
            placeholder="e.g. Travel"
            value={catName}
            onChangeText={setCatName}
            autoFocus
          />

          <Pressable 
            onPress={handleSaveCategory}
            disabled={savingCat || !catName.trim()}
            className={`bg-notion-text py-4 rounded-xl items-center ${(savingCat || !catName.trim()) ? 'opacity-50' : 'active:opacity-80'}`}
          >
            {savingCat ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Save Category</Text>}
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
