# Org Members Management — Test Plan

> **Coverage note:** Existing tests in `e2e/org-members.spec.ts` already cover the basic invite dialog open/close, email validation error, member row visibility, and remove confirmation dialog visibility. This plan focuses on **new** scenarios not yet covered.

## Assumptions

- The app is running at `http://localhost:3000`
- A valid test user session exists (logged in as themuuln1@gmail.com)
- The test user has `members.invite`, `members.remove`, and `members.manage_role` permissions
- The `/settings/users` page renders the `MembersClient` component with props from the server component
- No pagination is currently implemented — all members render in a single flat list
- UI labels are in Mongolian as per the codebase

---

## 1. Member List Display

### 1.1 Page renders with correct title and description

**Steps:**

1. Navigate to `/settings/users`
2. Verify the page shell title is `Хэрэглэгчид`
3. Verify the description contains `Байгууллагын гишүүд болон тэдний үүрэг`

**Expected:** The `PageShell` renders the heading and description text.

### 1.2 Current user is highlighted with "Та" badge

Already covered by existing test `shows members list on /settings/users`.

### 1.3 Each member row shows avatar initial, name, email, and role

**Steps:**

1. Navigate to `/settings/users`
2. For the first member row in the `div.divide-y > div` container:
   - Verify a round avatar element exists (could be initials or envelope icon)
   - Verify a name or `Нэргүй` text is visible
   - Verify an email address is visible (or `—` placeholder)
   - Verify a role badge (either `Badge` variant or `NativeSelect` depending on permissions)

**Expected:** Each row shows the member's details. Non-self members show either a role badge `Badge variant="outline"` or a `NativeSelect` for role management.

### 1.4 Loading state shows skeleton placeholders

**Steps:**

1. Navigate to a URL that triggers the loading state (or observe during navigation)
2. During loading, verify 4 skeleton rows are rendered with `Skeleton` components

**Expected:** Before data loads, 4 skeleton placeholders are displayed with round avatar, name/email lines, and role badge skeletons.

### 1.5 Error state shows error message and retry button

**Steps:**

1. Simulate a data fetch error (e.g., by blocking network requests manually in Playwright — `page.route()` to abort requests to relevant API)
2. Navigate to `/settings/users`
3. Verify the error heading `Алдаа гарлаа` is visible
4. Verify the error description about loading failure
5. Verify a `Дахин оролдох` (retry) button is visible

**Expected:** The error boundary catches the error and displays the error UI with a retry button.

---

## 2. Invite Member Flow

Existing tests cover: opening dialog, disabled submit with empty email, typing email, invalid email toast.
Not yet covered:

### 2.1 Cancel invite closes the dialog without action

**Steps:**

1. Navigate to `/settings/users`
2. Click `Гишүүн урих` button
3. Type an email in the input field
4. Click `Болих` (cancel) button
5. Verify the dialog is no longer visible
6. Click `Гишүүн урих` again
7. Verify the email input is empty (state was reset)

**Expected:** Cancel clears the form and closes the dialog. Reopening shows a fresh form.

### 2.2 Successful invite shows success toast and closes dialog

**Steps:**

1. Navigate to `/settings/users`
2. Click `Гишүүн урих`
3. Type a valid, non-existent email (e.g., `test-new-user-{timestamp}@example.com`)
4. Click `Урих`
5. Verify the success toast `Урилга амжилттай илгээгдлээ.` appears
6. Verify the dialog closes automatically
7. Verify the page revalidates (member list may show the new user)

**Expected:** A toast confirms the invite was sent. The dialog closes and the email input is reset.

### 2.3 Invite with already-existing org member shows error

**Steps:**

1. Navigate to `/settings/users`
2. Click `Гишүүн урих`
3. Type the email of an existing member shown in the list
4. Click `Урих`
5. Verify error toast: `Энэ хэрэглэгч аль хэдийн байгууллагад байна.`

**Expected:** The server action detects the duplicate and returns an error toast.

### 2.4 Invite while lacking permission hides the invite button

**Steps:**

1. Log in as a user without `members.invite` permission
2. Navigate to `/settings/users`
3. Verify the `Гишүүн урих` button is **not** visible

**Expected:** The invite trigger is conditionally rendered based on `canInvite` prop.

### 2.5 Enter key submits the invite

**Steps:**

1. Navigate to `/settings/users`
2. Open the invite dialog
3. Type a valid email
4. Press Enter
5. Verify the invite is submitted (either success toast or error toast appears)

**Expected:** The `onKeyDown` handler for Enter triggers `handleInvite`.

---

## 3. Member Role Management

### 3.1 Role dropdown is visible for non-self members (with permission)

**Steps:**

1. Navigate to `/settings/users`
2. For a member row that is NOT the current user (no `Та` badge):
   - Verify a `NativeSelect` element exists (not a read-only badge)
   - Verify it contains options: `Үүрэг сонгох` placeholder plus each role name

**Expected:** Users with `members.manage_role` permission see a `<select>` dropdown for other members. The current user sees a read-only role badge.

### 3.2 Can change member role via dropdown

**Steps:**

1. Navigate to `/settings/users`
2. Select a non-self member row
3. Change the role dropdown to a different role
4. Verify the success (no error toast appears)
5. Verify the dropdown shows the newly selected role

**Expected:** The role change triggers the server action and the UI updates.

### 3.3 Role dropdown is disabled for self member (current user)

**Steps:**

1. Navigate to `/settings/users`
2. For the current user's row (has `Та` badge):
   - Verify a read-only `Badge variant="outline"` is shown instead of a dropdown
   - Verify no `NativeSelect` exists for this row

**Expected:** The current user cannot change their own role.

### 3.4 Role management controls are hidden without permission

**Steps:**

1. Log in as a user without `members.manage_role` permission
2. Navigate to `/settings/users`
3. For any member row, verify a read-only role badge is shown (no dropdown)

**Expected:** When `canManageRole` is false, all members show a read-only role badge instead of a select.

### 3.5 Role change error shows error toast

**Steps:**

1. Navigate to `/settings/users`
2. Select a non-self member
3. Trigger a role change that will fail (e.g., by using `page.route()` to make the API fail)
4. Verify an error toast appears with the error message

**Expected:** Error from the server action is displayed via `toast.error()`.

---

## 4. Remove Member Flow

Existing test covers opening the remove confirmation dialog.
Not yet covered:

### 4.1 Cancel removal from confirmation dialog

**Steps:**

1. Navigate to `/settings/users`
2. If there are multiple members, click the trash icon on a non-self member
3. Verify the `Гишүүн хасах` confirmation dialog appears
4. Click `Буцах` (cancel)
5. Verify the dialog closes
6. Verify the member is still in the list

**Expected:** Canceling the removal does nothing; the member remains.

### 4.2 Confirm removal removes the member

**Steps:**

1. Navigate to `/settings/users`
2. Before removal, note the total member count
3. Click the trash icon on a non-self member
4. Click `Хасах` (confirm)
5. Verify success toast: `Гишүүнийг хассан.`
6. Verify the member row is no longer in the list
7. Verify the member count decreased by 1

**Expected:** The member is removed from the org and the UI updates accordingly.

### 4.3 Self-removal is prevented (no trash icon on self)

**Steps:**

1. Navigate to `/settings/users`
2. Find the current user's row (has `Та` badge)
3. Verify there is NO trash icon button in this row

**Expected:** The `canRemove` check also gates on `member.id !== currentUserId`, so no remove button appears for the current user.

### 4.4 Self-removal server-side prevention

**Steps:**

1. This is a server action test, but can be verified via the API:
   - Send a remove request with the current user's profile_id
   - Verify the response contains error: `Та өөрийгөө хасах боломжгүй.`

**Expected:** The server action explicitly checks `if (profileId === ctx.userId)` and returns an error.

### 4.5 Remove controls hidden without permission

**Steps:**

1. Log in as a user without `members.remove` permission
2. Navigate to `/settings/users`
3. Verify no trash icon buttons appear on any member row

**Expected:** When `canRemove` is false, all members show without the remove button.

### 4.6 Remove error shows error toast

**Steps:**

1. Navigate to `/settings/users`
2. Click the trash icon on a non-self member
3. Trigger a removal that fails (e.g., by using `page.route()` to make the API fail)
4. Verify an error toast appears

**Expected:** Error from the server action is displayed via `toast.error()`.

---

## 5. Edge Cases

### 5.1 Empty state when no members exist

**Steps:**

1. Navigate to `/settings/users` for an org with zero members
2. Verify the empty state illustration is visible (the `Users` icon)
3. Verify the heading `Гишүүд олдсонгүй`
4. Verify the description `Энэ байгууллагад хэрэглэгч бүртгэгдээгүй байна.`

**Expected:** The empty state shows the icon, heading, and description text.

### 5.2 Invalid email validation (client-side form)

Already covered by existing test `shows error toast for invalid email on invite`.

### 5.3 Invalid email validation (server-side)

**Steps:**

1. Navigate to `/settings/users`
2. Open invite dialog
3. Type an invalid email like `not-an-email`
4. Click `Урих`
5. Verify error toast: `Зөв и-мэйл хаяг оруулна уу.`

**Expected:** Both client-side (via field validation if any) and server-side regex validation catch invalid emails.

### 5.4 Invite with empty email shows disabled button

Already covered by existing test `invite submit button is disabled with empty email`.

### 5.5 Invite a user who belongs to another org

**Steps:**

1. This requires a specific test setup. Use `page.route()` to mock the response, or:
2. Navigate to `/settings/users`
3. Open invite dialog
4. Enter an email that exists in another org
5. Click `Урих`
6. Verify error toast: `Энэ хэрэглэгч өөр байгууллагад бүртгэлтэй байна...`

**Expected:** The server action detects the user is in another org and returns a specific error.

### 5.6 Remove member from confirmation using keyboard (Enter)

**Steps:**

1. Navigate to `/settings/users`
2. Click the trash icon on a non-self member
3. Press Enter while the `Хасах` button is focused
4. Verify the member is removed (success toast)

**Expected:** Keyboard navigation works correctly for the removal confirmation.

### 5.7 Members list updates after invite (page revalidation)

**Steps:**

1. Navigate to `/settings/users`
2. Note the initial member count
3. Invite a new member via dialog
4. After successful invite, verify the page appears to refresh or the member list updates

**Expected:** The server action calls `revalidatePath("/settings/users")` so the page should reflect the new member.

---

## 6. Permission Enforcement

### 6.1 Server action permission checks return errors

**Steps:**

1. Using Playwright's request context, call `inviteMember` server action directly
2. Verify it returns `{ error: "Эрх хүрэлцэхгүй байна." }` when lacking permission
3. Repeat for `removeMember` and `updateUserRole` actions

**Expected:** All three server actions check `ctx.permissions` and return permission errors.

### 6.2 UI hides all management controls without any member permissions

**Steps:**

1. Log in as a user without any of: `members.invite`, `members.remove`, `members.manage_role`
2. Navigate to `/settings/users`
3. Verify: no invite button, no remove icons, no role dropdowns

**Expected:** The page becomes a read-only member list with only `Badge` role labels and no action controls.

---

## Summary of Existing Coverage (do not duplicate)

The following scenarios are already covered in `e2e/org-members.spec.ts` and should NOT be duplicated:

| #   | Test                                                  | File                  |
| --- | ----------------------------------------------------- | --------------------- |
| 1   | Shows members list on /settings/users                 | `org-members.spec.ts` |
| 2   | Shows invite button when user has permission          | `org-members.spec.ts` |
| 3   | Opens invite dialog when clicking invite button       | `org-members.spec.ts` |
| 4   | Invite submit button is disabled with empty email     | `org-members.spec.ts` |
| 5   | Can type email in invite dialog                       | `org-members.spec.ts` |
| 6   | Shows error toast for invalid email on invite         | `org-members.spec.ts` |
| 7   | Shows member rows with avatars and names              | `org-members.spec.ts` |
| 8   | Can open remove confirmation dialog on another member | `org-members.spec.ts` |

## Success Criteria

- All scenarios listed above have corresponding Playwright tests
- Tests use Playwright best practices: `getByRole()`, `getByText()`, `getByPlaceholder()` over raw CSS/XPath
- Tests are independently runnable and include proper `beforeEach` authentication setup
- New tests are added to `e2e/org-members.spec.ts` (extending the existing describe block) or to new spec files if the file grows too large
