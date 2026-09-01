"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
exports.toSafeUser = toSafeUser;
var Role;
(function (Role) {
    Role["ADMIN"] = "Admin";
    Role["USER"] = "User";
})(Role || (exports.Role = Role = {}));
function toSafeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}
//# sourceMappingURL=user.model.js.map