const user = {'user_id': 'admin', 'roles': [{'name': 'Super Admin', 'functionalities': [{'name': 'infra.app.manage'}, {'name': 'sys.security.manage'}]}]};
const permissionSlug = 'sys.security.manage';

const hasPermission = (permissionSlug) => {
    if (!user || (!user.permissions && !user.roles)) return false;
    if (user.permissions && user.permissions.includes(permissionSlug)) return true;
    if (user.roles) {
      return user.roles.some(r => r.functionalities?.some(f => f.name === permissionSlug));
    }
    return false;
};
console.log(hasPermission(permissionSlug));

const activeTab = "servers";
console.log(activeTab.replace(/s$/, ''));
