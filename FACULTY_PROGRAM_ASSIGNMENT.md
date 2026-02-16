# Faculty Program Category Assignment

## Overview
This document describes the faculty program category assignment system implemented to control activity approval workflow and prevent conflicts between faculty from different departments.

## Problem Statement
Without program category assignment for faculty:
- Multiple faculty from different departments could manage the same student's activities
- Approval conflicts could arise when faculty from unrelated programs try to review activities
- No clear jurisdiction over which faculty should approve which student activities

## Solution
Implement a **"View All, Approve Own"** pattern:
- Faculty can **VIEW** all students (for information and collaboration purposes)
- Faculty can only **APPROVE/REJECT** activities from students in their assigned program category
- Each faculty member has clear jurisdiction over their program category's students

## Implementation Details

### 1. Backend Changes

#### A. User Model (Already exists)
The `programCategory` field in the User model now applies to both students AND faculty:
```javascript
programCategory: {
  type: DataTypes.STRING,
  allowNull: true,
},
program: {
  type: DataTypes.STRING,
  allowNull: true,
},
specialization: {
  type: DataTypes.STRING,
  allowNull: true,
}
```

#### B. Auth Controller (`backend/src/controllers/authController.js`)
**Change**: Made `programCategory` **required** for BOTH students and faculty during registration

```javascript
// Before: programCategory was required only for students
programCategory: Joi.string()
  .when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

// After: programCategory is required for ALL roles
programCategory: Joi.string().required(),
```

**Why**: Faculty need to select their program category to control which students' activities they can approve.

#### C. Faculty Controller (`backend/src/controllers/facultyController.js`)
**Change**: Added programCategory-based filtering to activity retrieval functions

##### `getPendingActivities` Function:
```javascript
// Filter activities based on faculty's programCategory
if (req.user.role === 'faculty') {
  const faculty = await User.findByPk(req.user.id);
  
  const studentsInCategory = await User.findAll({
    where: {
      role: 'student',
      programCategory: faculty.programCategory
    },
    attributes: ['id']
  });
  
  const studentIds = studentsInCategory.map(s => s.id);
  where.studentId = studentIds;
}
```

**Logic**:
1. Fetch the faculty's `programCategory`
2. Find all students with matching `programCategory`
3. Filter activities to only show those submitted by students in the same category

##### `getAllActivities` Function:
Same filtering logic applied to ensure faculty only see activities from their program category students.

##### Enhanced User Information in Responses:
Both functions now include student's program information:
```javascript
model: User,
as: 'student',
attributes: ['id', 'name', 'email', 'studentId', 'department', 'year', 'programCategory', 'program', 'specialization']
```

### 2. Frontend Changes

#### A. Register Form (`frontend/src/components/auth/RegisterForm.jsx`)

**Change 1**: Added programCategory dropdown for faculty
```jsx
{formData.role === USER_ROLES.FACULTY && (
  <>
    <div className="sm:col-span-1">
      <label htmlFor="programCategory">Program Category *</label>
      <select
        id="programCategory"
        name="programCategory"
        required
        value={formData.programCategory || ''}
        onChange={handleChange}
      >
        <option value="">Select Program Category</option>
        {Object.entries(PROGRAM_CATEGORIES).map(([key, value]) => (
          <option key={key} value={key}>{value}</option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        You will only approve activities from students in this category
      </p>
    </div>
    
    <div className="sm:col-span-1">
      <label htmlFor="department">Department *</label>
      <input id="department" name="department" ... />
    </div>
  </>
)}
```

**Change 2**: Updated validation and submission logic
```javascript
// Validation now requires programCategory for everyone
if (!formData.programCategory) {
  setError('Please fill in all required fields');
  return;
}

// For faculty: keep programCategory but remove student-specific fields
if (submitData.role !== USER_ROLES.STUDENT) {
  delete submitData.program;
  delete submitData.specialization;
  delete submitData.year;
  delete submitData.studentId;
  // programCategory is kept
}
```

#### B. Faculty Dashboard (`frontend/src/components/faculty/Dashboard.jsx`)

**Change**: Display faculty's program category in welcome banner
```jsx
import { PROGRAM_CATEGORIES } from '../../utils/programsData';

// In the banner:
{user.programCategory && (
  <p className="text-xs sm:text-sm text-emerald-200">
    <svg>...</svg>
    <span>Program Category: {PROGRAM_CATEGORIES[user.programCategory]}</span>
  </p>
)}
```

#### C. Review Queue (`frontend/src/components/faculty/ReviewQueue.jsx`)

**Change**: Enhanced activity cards to show student program information
```jsx
// Replaced department-only display with program-focused view:
{
  icon: "...",
  content: (
    <div>
      <p className="font-medium">{activity.student?.program || activity.student?.department}</p>
      {activity.student?.specialization && (
        <p className="text-xs">{activity.student.specialization}</p>
      )}
    </div>
  )
},
{
  icon: "...",
  content: (
    <div>
      <p className="font-medium">Year {activity.student?.year}</p>
      <p className="text-xs">{activity.student?.department}</p>
    </div>
  )
}
```

#### D. All Activities (`frontend/src/components/faculty/AllActivities.jsx`)

**Change**: Updated student info display to show program and specialization
```jsx
<div className="flex items-center">
  <svg>...</svg>
  <span className="truncate">
    {activity.student?.program || activity.student?.department}
    {activity.student?.specialization && ` (${activity.student.specialization})`}
  </span>
</div>
<div className="flex items-center">
  <svg>...</svg>
  <span>Year {activity.student?.year}</span>
</div>
```

## User Experience Flow

### Faculty Registration Flow
1. Faculty selects **Faculty** role
2. **New**: Faculty selects **Program Category** from dropdown (e.g., "Engineering & Technology", "Computer Applications", etc.)
3. Faculty enters Department name (e.g., "Computer Science")
4. Faculty completes other required fields
5. System validates that programCategory is provided
6. Faculty account is created with assigned program category

### Activity Approval Flow
1. **Student submits activity**: Activity has studentId linked to User with programCategory
2. **Faculty views dashboard**: Only sees pending activities from students in their programCategory
3. **Faculty reviews activity**: Can see student's complete program information (program, specialization, year)
4. **Faculty approves/rejects**: Decision is recorded in database
5. **Other faculty**: Cannot see activities from students outside their programCategory

### Student Browsing Flow (Unchanged)
- Faculty can still browse ALL students via Student List
- This maintains transparency and collaboration opportunities
- Only activity approval is restricted by program category

## Program Categories Available
1. **ENGINEERING_TECHNOLOGY**: Engineering & Technology
2. **COMPUTER_APPLICATIONS**: Computer Applications (BCA, MCA)
3. **SCIENCE**: Science Programs
4. **AGRICULTURE_FISHERIES**: Agriculture & Fisheries Science
5. **HEALTH_SCIENCES_PHARMACY**: Health Sciences & Pharmacy
6. **NURSING**: Nursing & Midwifery
7. **MARITIME_STUDIES**: Maritime Studies
8. **MANAGEMENT_COMMERCE_LAW**: Management, Commerce & Law
9. **HOSPITALITY_CULINARY**: Hospitality & Culinary Arts
10. **PHD_PROGRAMS**: PhD Programs

## Benefits

### 1. Clear Jurisdiction
Each faculty member has clear responsibility over their program category's students' activities.

### 2. No Conflicts
Faculty from different departments cannot interfere with each other's approval decisions.

### 3. Relevant Expertise
Faculty review activities from students in their area of expertise.

### 4. Scalability
As university adds more programs, faculty are automatically organized by category.

### 5. Transparency Maintained
Faculty can still view all students for collaboration and information purposes.

## Database Migration

For existing faculty users without programCategory:

```sql
-- Check faculty without programCategory
SELECT id, name, email, department FROM Users 
WHERE role = 'faculty' AND programCategory IS NULL;

-- Update faculty based on department mapping
-- Example:
UPDATE Users 
SET programCategory = 'COMPUTER_APPLICATIONS'
WHERE role = 'faculty' 
  AND department LIKE '%Computer%';

UPDATE Users 
SET programCategory = 'ENGINEERING_TECHNOLOGY'
WHERE role = 'faculty' 
  AND department IN ('Mechanical', 'Electrical', 'Civil', 'Electronics');

-- Verification
SELECT programCategory, COUNT(*) 
FROM Users 
WHERE role = 'faculty' 
GROUP BY programCategory;
```

## Testing Checklist

### Registration Testing
- [ ] Faculty cannot register without selecting programCategory
- [ ] programCategory dropdown shows all 10 categories
- [ ] Faculty registration with programCategory succeeds
- [ ] Faculty data includes programCategory in database

### Activity Approval Testing
- [ ] Faculty A (Category X) can see activities from students in Category X
- [ ] Faculty A cannot see activities from students in Category Y
- [ ] Faculty A can approve/reject activities from their category
- [ ] Student activity shows correct program information (program, specialization)

### Dashboard Testing
- [ ] Faculty dashboard displays their assigned program category
- [ ] Pending activities count matches filtered activities
- [ ] Activity cards show student program information

### Student List Testing (Should still work)
- [ ] Faculty can view ALL students regardless of program category
- [ ] Student list filters work correctly
- [ ] Search across all students functions properly

## Future Enhancements

1. **Multiple Program Categories**: Allow faculty to be assigned to multiple categories
2. **Activity Type Restrictions**: Further filter by activity types (e.g., technical workshops only for Engineering faculty)
3. **Cross-Category Approval**: Admin feature to assign specific faculty as reviewers for cross-category activities
4. **Analytics**: Generate reports showing approval rates by program category
5. **Faculty Specialization**: Add sub-categories within program categories for more granular control

## Troubleshooting

### Issue: Faculty sees no pending activities
**Cause**: No students in faculty's programCategory have submitted activities
**Solution**: Verify student programCategories match faculty programCategory

### Issue: Faculty registration fails
**Cause**: programCategory not selected
**Solution**: Ensure programCategory dropdown selection is made before submitting

### Issue: Student program info not showing in activity cards
**Cause**: Backend not returning updated User attributes
**Solution**: Verify facultyController includes programCategory, program, specialization in User model attributes

### Issue: Database validation errors
**Cause**: Existing NULL programCategory values for faculty
**Solution**: Run database migration to populate programCategory for existing faculty

## Conclusion

The faculty program category assignment system ensures:
- ✅ Clear approval workflow
- ✅ No conflicts between faculty
- ✅ Relevant expertise for activity evaluation
- ✅ Maintained transparency in student browsing
- ✅ Scalable organization as university grows

This implementation balances control (approval jurisdiction) with transparency (student browsing), creating an efficient and conflict-free activity management system.
