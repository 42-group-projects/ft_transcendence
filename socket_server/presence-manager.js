// 誰がどのステータスかをメモリ上で記憶するMap
// 形式: { "user-uuid-1234": "online", "user-uuid-5678": "in_game" }
const userStatus = new Map();

function markUserOnline(userId) {
  userStatus.set(userId, 'online');
}

function markUserInGame(userId) {
  if (userStatus.has(userId)) {
    userStatus.set(userId, 'in_game');
  }
}

function markUserOffline(userId) {
  userStatus.delete(userId);
}

function getUserStatus(userId) {
  return userStatus.get(userId) || 'offline';
}

// 複数人のステータスを一括で取得する関数（フロントエンドの初回ロード用）
function getMultipleUsersStatus(userIds) {
  const statuses = {};
  userIds.forEach(id => {
    statuses[id] = getUserStatus(id);
  });
  return statuses;
}

module.exports = {
  markUserOnline,
  markUserInGame,
  markUserOffline,
  getUserStatus,
  getMultipleUsersStatus
};
