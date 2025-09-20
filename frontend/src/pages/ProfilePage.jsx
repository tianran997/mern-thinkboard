import React, { useState } from 'react';
import { User, Mail, Calendar, Edit3, Lock, Save, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    avatar: user?.avatar || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileForm.username.trim()) {
      toast.error('Username is required');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.updateProfile({
        username: profileForm.username.trim(),
        avatar: profileForm.avatar
      });

      if (response.success) {
        updateUser(response.user);
        setIsEditingProfile(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword
      });

      if (response.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        setIsChangingPassword(false);
        toast.success('Password changed successfully');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({
      username: user?.username || '',
      avatar: user?.avatar || ''
    });
    setIsEditingProfile(false);
  };

  const handleCancelPasswordChange = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setIsChangingPassword(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            user?.username?.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-base-content/70">Manage your account information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="card bg-base-100 shadow-sm border">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Profile Information</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="btn btn-outline btn-sm"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Username</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Avatar URL (optional)</span>
                  </label>
                  <input
                    type="url"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                  >
                    {!loading && <Save size={16} />}
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn btn-ghost"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User size={20} className="text-base-content/70" />
                  <div>
                    <p className="font-medium">Username</p>
                    <p className="text-base-content/70">{user?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-base-content/70" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-base-content/70">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-base-content/70" />
                  <div>
                    <p className="font-medium">Member since</p>
                    <p className="text-base-content/70">
                      {user?.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Change */}
        <div className="card bg-base-100 shadow-sm border">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Password & Security</h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="btn btn-outline btn-sm"
                >
                  <Lock size={16} />
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Current Password</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input input-bordered w-full"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    className="input input-bordered w-full"
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                  >
                    {!loading && <Save size={16} />}
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPasswordChange}
                    className="btn btn-ghost"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-base-content/70">
                  Keep your account secure by using a strong password and updating it regularly.
                </p>
                
                <div className="alert alert-info">
                  <div>
                    <h3 className="font-bold">Password Requirements</h3>
                    <div className="text-sm mt-1">
                      <ul className="list-disc list-inside space-y-1">
                        <li>At least 6 characters long</li>
                        <li>Mix of letters, numbers, and symbols recommended</li>
                        <li>Avoid using personal information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="card bg-base-100 shadow-sm border mt-8">
        <div className="card-body">
          <h2 className="card-title mb-4">Account Activity</h2>
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Account Status</div>
              <div className="stat-value text-primary">Active</div>
              <div className="stat-desc">
                {user?.isVerified ? 'Verified account' : 'Email verification pending'}
              </div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Member Since</div>
              <div className="stat-value text-secondary">
                {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'Unknown'}
              </div>
              <div className="stat-desc">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Date unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;