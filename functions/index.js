const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Sets a custom user role claim on a user's auth token and updates their role in Firestore.
 * This function can only be called by an authenticated user with a 'superadmin' custom claim.
 * @param {object} data - The data passed to the function, expecting { userId: string, role: string }.
 * @param {object} context - The context of the function call, containing auth information.
 * @returns {Promise<{message: string}>} A success message.
 * @throws {HttpsError} Throws an error if the caller is not a superadmin, or if arguments are invalid.
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Check if the caller is authenticated and is a superadmin.
  if (context.auth.token.role !== "superadmin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Bu işlemi yapmak için Süper Admin yetkisine sahip olmalısınız."
    );
  }

  const { userId, role } = data;

  if (!userId || !role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Lütfen 'userId' ve 'role' parametrelerini sağlayın."
    );
  }

  // 2. Validate the role.
  const validRoles = ["student", "coach", "superadmin"];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Belirtilen rol geçerli değil. (student, coach, superadmin)"
    );
  }

  try {
    // 3. Set the custom claim on the user's auth token.
    await admin.auth().setCustomUserClaims(userId, { role: role });

    // 4. Update the user's role in the Firestore 'users' collection for client-side consistency.
    await admin.firestore().collection("users").doc(userId).update({
      role: role,
    });

    return {
      message: `Başarılı! ${userId} kullanıcısı artık bir ${role}.`,
    };
  } catch (error) {
    console.error("Kullanıcı rolü ayarlanırken hata oluştu:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Kullanıcı rolü ayarlanırken dahili bir hata oluştu."
    );
  }
});
