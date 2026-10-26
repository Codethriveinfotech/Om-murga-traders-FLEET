import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';

// Context & Styles
import { DashboardDataProvider, useDashboardData } from '../../context/DashboardDataContext';
import { styles, fontStyle } from './AdminStyles';

// Screen Tabs
import OverviewTab from './tabs/OverviewTab';
import VehiclesTab from './tabs/VehiclesTab';
import DriversTab from './tabs/DriversTab';
import TripsTab from './tabs/TripsTab';
import MaintenanceTab from './tabs/MaintenanceTab';
import ReportsTab from './tabs/ReportsTab';
import ProfileTab from './tabs/ProfileTab';
import FuelMonitorTab from './tabs/FuelMonitorTab';

const DashboardStack = createStackNavigator();

function DashboardLayoutContent() {
  const { user, clearAuth } = useAuthStore();
  const { loading } = useDashboardData();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch real notifications from the backend
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get('/v1/notifications');
        if (res.data?.success) {
          setNotifications(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    
    // Fetch initially and then every 30 seconds
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/v1/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    for (const id of unreadIds) {
      await handleMarkAsRead(id);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Determine active tab route using React Navigation state
  const navState = useNavigationState((s) => s);
  const activeTab = navState ? (navState.routes[navState.index]?.name || 'overview') : 'overview';

  // Build menu items based on user role
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'vehicles', label: 'Vehicles', icon: 'car-outline' },
    { id: 'drivers', label: 'Drivers', icon: 'people-outline' },
    { id: 'trips', label: 'Trips', icon: 'navigate-outline' },
    { id: 'maintenance', label: 'Maintenance', icon: 'construct-outline' },
    { id: 'fuel-monitor', label: 'Fuel Monitor', icon: 'bar-chart-outline' },
    { id: 'reports', label: 'Reports', icon: 'analytics-outline' },
    { id: 'profile', label: 'Settings', icon: 'settings-outline' },
  ];

  const avatarChar = user?.name ? user.name[0].toUpperCase() : 'A';
  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'System Owner' : 'Fleet Admin';

  const renderSidebarContent = () => (
    <>
      <View>
        <View style={styles.sidebarHeader}>
          <View style={styles.miniLogo}>
            <Text style={styles.miniLogoText}>FP</Text>
          </View>
          <View>
            <Text style={styles.sidebarTitle}>FleetPro</Text>
            <Text style={styles.sidebarSubtitle}>Ohm Murga Traders</Text>
          </View>
        </View>

        <View style={styles.menuItems}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const iconColor = isActive ? '#FFFFFF' : '#94A3B8';

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  isActive && styles.menuItemActive,
                ]}
                onPress={() => {
                  navigation.navigate(item.id);
                  setDrawerOpen(false);
                }}
              >
                <View style={{ marginRight: 12 }}>
                  <Ionicons name={item.icon as any} size={18} color={iconColor} />
                </View>
                <Text
                  style={[
                    styles.menuItemText,
                    isActive && styles.menuItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Admin footer profile info card */}
      <View style={styles.adminFooterCard}>
        <View style={styles.adminAvatar}>
          <Text style={styles.avatarText}>{avatarChar}</Text>
        </View>
        <View style={styles.adminInfo}>
          <Text style={styles.adminName} numberOfLines={1}>{user?.name || 'Admin User'}</Text>
          <Text style={styles.adminEmail} numberOfLines={1}>{user?.email || user?.phone || 'admin@system.com'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutMiniBtn} onPress={clearAuth}>
          <Ionicons name="log-out-outline" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Desktop Sidebar Navigation */}
      {isDesktop && (
        <View style={styles.sidebar}>
          {renderSidebarContent()}
        </View>
      )}

      {/* Mobile & Tablet Slide-out Drawer Overlay */}
      {!isDesktop && drawerOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, flexDirection: 'row' }}>
          {/* Backdrop */}
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)' }} 
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)} 
          />
          {/* Drawer Menu */}
          <View style={[styles.sidebar, { width: 260, height: '100%', shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 16 }]}>
            {renderSidebarContent()}
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View style={[styles.mainContent, !isDesktop && { paddingHorizontal: 16, paddingVertical: 16 }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!isDesktop && (
              <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ marginRight: 16, padding: 4 }}>
                <Ionicons name="menu-outline" size={28} color="#0F172A" />
              </TouchableOpacity>
            )}
            <Text style={[styles.headerTitle, isMobile && { fontSize: 18 }]}>
              {activeTab === 'overview' ? 'Dashboard' : activeTab.toUpperCase()}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {(activeTab === 'overview' && !isMobile) && (
              <View style={styles.headerDateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 8 }} />
                <Text style={styles.headerDateText}>May 25 - May 31, 2025</Text>
                <Ionicons name="chevron-down-outline" size={10} color="#64748B" style={{ marginLeft: 8 }} />
              </View>
            )}
            
            <View style={{ position: 'relative', zIndex: 9999 }}>
              <TouchableOpacity 
                style={styles.iconCircle}
                onPress={() => setShowNotifications(!showNotifications)}
              >
                <Ionicons name="notifications-outline" size={16} color="#64748B" />
                {unreadCount > 0 && <View style={styles.badgeAlertDot} />}
              </TouchableOpacity>
              
              {showNotifications && (
                <View style={{
                  position: 'absolute',
                  top: 40,
                  right: 0,
                  width: 320,
                  maxHeight: 400,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 8,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  overflow: 'hidden'
                }}>
                  <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#F8FAFC', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 14 }}>Notifications</Text>
                    {unreadCount > 0 && (
                      <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>{unreadCount} new</Text>
                    )}
                  </View>
                  
                  {notifications.length === 0 ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#94A3B8', fontSize: 12 }}>No notifications yet.</Text>
                    </View>
                  ) : (
                    <View style={{ maxHeight: 300, overflow: 'scroll' }}>
                      {notifications.map(n => (
                        <TouchableOpacity 
                          key={n.id} 
                          style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: n.isRead ? '#FFFFFF' : '#F0F9FF' }}
                          onPress={() => !n.isRead && handleMarkAsRead(n.id)}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: n.type === 'CRITICAL' ? '#DC2626' : n.type === 'WARNING' ? '#D97706' : '#1D4ED8' }}>{n.title}</Text>
                            {!n.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />}
                          </View>
                          <Text style={{ fontSize: 11, color: '#475569', lineHeight: 16 }}>{n.message}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  
                  {unreadCount > 0 && (
                    <TouchableOpacity 
                      style={{ padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
                      onPress={handleMarkAllAsRead}
                    >
                      <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>Mark all as read</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
 
            <View style={styles.headerProfileBadge}>
              <View style={[styles.adminAvatar, { width: 28, height: 28, borderRadius: 14, backgroundColor: '#64748B' }]}>
                <Text style={[styles.avatarText, { fontSize: 11 }]}>{avatarChar}</Text>
              </View>
              {!isMobile && (
                <View style={{ marginLeft: 8, marginRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>{user?.name || 'Admin User'}</Text>
                  <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '500', fontFamily: fontStyle }}>{roleLabel}</Text>
                </View>
              )}
              {!isMobile && <Ionicons name="chevron-down-outline" size={10} color="#64748B" />}
            </View>
          </View>
        </View>
  
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color="#1D4ED8" size="large" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
              <DashboardStack.Screen name="overview" component={OverviewTab} />
              <DashboardStack.Screen name="vehicles" component={VehiclesTab} />
              <DashboardStack.Screen name="drivers" component={DriversTab} />
              <DashboardStack.Screen name="trips" component={TripsTab} />
              <DashboardStack.Screen name="maintenance" component={MaintenanceTab} />
              <DashboardStack.Screen name="fuel-monitor" component={FuelMonitorTab} />
              <DashboardStack.Screen name="reports" component={ReportsTab} />
              <DashboardStack.Screen name="profile" component={ProfileTab} />
            </DashboardStack.Navigator>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardDataProvider>
      <DashboardLayoutContent />
    </DashboardDataProvider>
  );
}
