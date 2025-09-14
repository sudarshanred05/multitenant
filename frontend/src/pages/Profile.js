import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    shopifyStoreName: user?.shopifyStoreName || '',
    shopifyAccessToken: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updateData = {};
    if (formData.shopifyStoreName && formData.shopifyStoreName !== user?.shopifyStoreName) {
      updateData.shopifyStoreName = formData.shopifyStoreName;
    }
    if (formData.shopifyAccessToken) {
      updateData.shopifyAccessToken = formData.shopifyAccessToken;
    }

    if (Object.keys(updateData).length === 0) {
      toast.info('No changes to save');
      setLoading(false);
      return;
    }

    try {
      const result = await updateProfile(updateData);
      if (result.success) {
        toast.success('Profile updated successfully!');
        setFormData(prev => ({ ...prev, shopifyAccessToken: '' })); // Clear token field
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Update your Shopify store credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shopify Store Name
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="shopifyStoreName"
                  value={formData.shopifyStoreName}
                  onChange={handleChange}
                  placeholder="your-store-name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm">
                  .myshopify.com
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shopify Access Token
              </label>
              <input
                type="password"
                name="shopifyAccessToken"
                value={formData.shopifyAccessToken}
                onChange={handleChange}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your access token from your Shopify Partner Dashboard
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            How to get your Shopify Access Token:
          </h3>
          <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
            <li>Go to your Shopify Partner Dashboard</li>
            <li>Create a private app or use an existing one</li>
            <li>Enable the necessary API permissions (read_products, read_customers, read_orders)</li>
            <li>Copy the Admin API access token</li>
            <li>Paste it in the field above</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Profile;
