import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  BookOpen,
  Star,
  Clock,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { remindersApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [notifiedReminders, setNotifiedReminders] = useState(new Set());

  // 检查即将到期的提醒并显示应用内通知
  const checkForUrgentReminders = useCallback(() => {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    upcomingReminders.forEach(reminder => {
      const reminderDate = new Date(reminder.reminderDate);
      const reminderId = reminder.id || `${reminder.noteId}-${reminder.title}`;
      
      // 检查是否是即将到期的提醒（未完成、未通知过、5分钟内到期）
      if (
        reminderDate >= now && 
        reminderDate <= fiveMinutesFromNow && 
        !reminder.isCompleted &&
        !notifiedReminders.has(reminderId)
      ) {
        // 显示突出的 Toast 通知
        toast.success(
          <div 
            className="cursor-pointer p-2" 
            onClick={() => navigate(`/notes/${reminder.noteId}`)}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">⏰</div>
              <div>
                <div className="font-bold text-lg">{reminder.title}</div>
                <div className="text-sm text-gray-600 mt-1">笔记: {reminder.noteTitle}</div>
                {reminder.description && (
                  <div className="text-sm text-gray-500 mt-1">{reminder.description}</div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {formatDistanceToNow(reminderDate, { addSuffix: true })} | 点击查看笔记
                </div>
              </div>
            </div>
          </div>,
          { 
            duration: 15000, // 15秒显示时间
            position: 'top-center',
            style: {
              maxWidth: '450px',
              backgroundColor: '#f59e0b',
              color: 'white',
              fontSize: '16px',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              border: '2px solid #d97706'
            },
            icon: '🔔'
          }
        );

        // 标记为已通知
        setNotifiedReminders(prev => new Set(prev).add(reminderId));
        
        // 可选：播放提示音（如果需要）
        // const audio = new Audio('/notification-sound.mp3');
        // audio.play().catch(e => console.log('无法播放提示音:', e));
      }
    });
  }, [upcomingReminders, notifiedReminders, navigate]);

  const fetchReminders = useCallback(async () => {
    try {
      const [upcomingRes, todayRes] = await Promise.all([
        remindersApi.getUpcoming(10), // 获取更多提醒
        remindersApi.getToday()
      ]);
      
      if (upcomingRes.success) {
        setUpcomingReminders(upcomingRes.reminders || []);
      }
      
      if (todayRes.success) {
        setTodayReminders(todayRes.reminders || []);
      }
    } catch (error) {
      // 如果是频率限制错误，静默处理
      if (error.response?.status !== 429) {
        console.error('Error fetching reminders:', error);
      }
    }
  }, []);

  useEffect(() => {
    // 初始加载提醒
    fetchReminders();
    
    // 设置定时器但降低频率
    // 每2分钟检查一次紧急提醒（而不是每分钟）
    const urgentInterval = setInterval(() => {
      checkForUrgentReminders();
    }, 2 * 60 * 1000);
    
    // 每10分钟刷新提醒列表（而不是每5分钟）
    const fetchInterval = setInterval(() => {
      fetchReminders();
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(urgentInterval);
      clearInterval(fetchInterval);
    };
  }, []); // 空依赖数组，避免重复调用

  // 手动刷新按钮的处理函数
  const handleManualRefresh = useCallback(() => {
    fetchReminders();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path) => location.pathname === path;
  
  const pendingRemindersCount = upcomingReminders.filter(r => !r.isCompleted).length;

  const menuItems = [
    {
      label: 'All Notes',
      path: '/notes',
      icon: BookOpen,
      active: isActivePath('/') || isActivePath('/notes')
    },
    {
      label: 'Favorites',
      path: '/notes?isFavorite=true',
      icon: Star,
      active: location.search.includes('isFavorite=true')
    }
  ];

  return (
    <div className="drawer lg:drawer-open">
      <input 
        id="drawer-toggle" 
        type="checkbox" 
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={(e) => setSidebarOpen(e.target.checked)}
      />
      
      {/* Sidebar */}
      <div className="drawer-side">
        <label htmlFor="drawer-toggle" className="drawer-overlay"></label>
        <aside className="min-h-full w-80 bg-base-100 border-r border-base-300">
          {/* Logo */}
          <div className="p-4 border-b border-base-300">
            <Link to="/" className="flex items-center gap-3">
              <div className="text-2xl font-bold text-primary">📝</div>
              <span className="text-xl font-bold">ThinkBoard</span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="p-4">
            <ul className="menu space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      item.active
                        ? 'bg-primary text-primary-content'
                        : 'hover:bg-base-200'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Today's Reminders */}
          {todayReminders.length > 0 && (
            <div className="p-4 border-t border-base-300">
              <h3 className="font-semibold text-sm text-base-content/70 mb-3">
                Today's Reminders ({todayReminders.length})
              </h3>
              <div className="space-y-2">
                {todayReminders.slice(0, 4).map((reminder) => (
                  <Link
                    key={reminder.id || `${reminder.noteId}-${reminder.title}`}
                    to={`/notes/${reminder.noteId}`}
                    className={`block p-3 rounded-lg transition-colors ${
                      reminder.isCompleted 
                        ? 'bg-success/10 text-success' 
                        : 'bg-base-200 hover:bg-base-300'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <p className="font-medium text-sm line-clamp-1">
                      {reminder.isCompleted && '✓ '}{reminder.title}
                    </p>
                    <p className="text-xs text-base-content/70 mt-1">
                      <Clock size={12} className="inline mr-1" />
                      {new Date(reminder.reminderDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </Link>
                ))}
                {todayReminders.length > 4 && (
                  <p className="text-xs text-base-content/50 text-center">
                    +{todayReminders.length - 4} more reminders
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Main Content */}
      <div className="drawer-content flex flex-col">
        {/* Top Navigation */}
        <div className="navbar bg-base-100 border-b border-base-300 px-4">
          <div className="flex-none lg:hidden">
            <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost">
              <Menu size={20} />
            </label>
          </div>
          
          <div className="flex-1">
            {/* Search can be added here if needed */}
          </div>

          <div className="flex-none gap-2">
            {/* Notifications */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <div className="indicator">
                  <Bell size={20} />
                  {pendingRemindersCount > 0 && (
                    <span className="badge badge-sm badge-error indicator-item">
                      {pendingRemindersCount > 9 ? '9+' : pendingRemindersCount}
                    </span>
                  )}
                </div>
              </div>
              
              {notificationsOpen && (
                <div className="dropdown-content z-[1] card card-compact w-96 p-2 shadow bg-base-100 border max-h-96">
                  <div className="card-body">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold">
                        通知 ({pendingRemindersCount})
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handleManualRefresh}
                          className="btn btn-ghost btn-sm"
                        >
                          刷新
                        </button>
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="btn btn-ghost btn-sm btn-square"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {upcomingReminders.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-base-content/70 text-sm">
                          暂无即将到来的提醒
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {upcomingReminders.map((reminder) => (
                          <Link
                            key={reminder.id || `${reminder.noteId}-${reminder.title}`}
                            to={`/notes/${reminder.noteId}`}
                            className={`block p-3 rounded-lg transition-colors border ${
                              reminder.isCompleted
                                ? 'bg-success/10 border-success/20 text-success'
                                : 'hover:bg-base-200 border-base-300'
                            }`}
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <p className="font-medium text-sm line-clamp-1">
                              {reminder.isCompleted && '✓ '}{reminder.title}
                            </p>
                            <p className="text-xs text-base-content/70 mt-1">
                              📝 {reminder.noteTitle}
                            </p>
                            {reminder.description && (
                              <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                                {reminder.description}
                              </p>
                            )}
                            <p className="text-xs text-base-content/50 mt-2">
                              {formatDistanceToNow(new Date(reminder.reminderDate), {
                                addSuffix: true
                              })}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    {/* 应用内通知说明 */}
                    <div className="alert alert-info text-xs mt-2">
                      <div>
                        <p>应用会在提醒即将到期时自动显示通知</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border">
                <li className="menu-title">
                  <span>{user?.username}</span>
                  <span className="text-xs">{user?.email}</span>
                </li>
                <li>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User size={16} />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings size={16} />
                    Settings
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-error">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;