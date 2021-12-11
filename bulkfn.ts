const bulkUploadUsersFn = async (
  users: any,
  hospital: string,
  hospitalId: number
) => {
  try {
    if (!isDef(users) || isEmpty(users)) {
      return [];
    }

    if (!isDef(hospital) || isEmpty(hospital)) {
      return null;
    }

    let isHospitalExists = await Hospital.findOne({
      _id: hospital,
    }).lean();

    if (!isDef(isHospitalExists)) {
      throw Boom.badRequest("Hospital not found");
    }

    let oldUsers = await User.find(
      {
        hospital,
        deleted: false,
      },
      "-_id email mobile employeeId patientId"
    ).lean();

    users = uniqWith(users, isEqual);

    forEach(users, (user) => {
      user.firstName = capitalize(user.firstName);
      user.lastName = capitalize(user.lastName);
      user.email = trim(user.email);
      user.mobile = trim(user.mobile);
      user.role = trim(user.role);
      user.employeeId = trim(user.employeeId);
      user.department = trim(user.department);
      user.gender = capitalize(user.gender);
      user.image = user.image;
    });

    //ADD RAWMOBILE AND GENERATE EMPLOYEE ID BY ADDING HOSPITAL ID
    users.forEach((user: any) => {
      if (isDef(user.mobile) && !isEmpty(user.mobile)) {
        user.rawMobile = user.mobile;
        let formatedMobile = getFormattedMobile(user.mobile, user.countryCode);
        if (formatedMobile.valid) {
          user.mobile = formatedMobile.mobile.toString();
        }
      }

      if (isDef(user.employeeId) && !isEmpty(user.employeeId)) {
        user.employeeId = user.employeeId + "-" + hospitalId.toString();
      }
    });

    //REMOVING USERS WHOSE EMAIL MATCH IN DATABASE
    users.forEach((user: any) => {
      if (isDef(user.email) && !isEmpty(user.email)) {
        console.log("email run");
        users = differenceBy(users, oldUsers, "email");
      }
    });

    //REMOVING USERS WHOSE MOBILE MATCH IN DATABASE
    users = differenceBy(users, oldUsers, "mobile");

    //REMOVING USERS WHOSE EMPLOYEE ID MATCH IN DATABASE
    users = differenceBy(users, oldUsers, "employeeId");

    //REMOVING DEPLICATE EMAILS FROM FRONTEND
    users.forEach((user: any) => {
      if (isDef(user.email) && !isEmpty(user.email)) {
        users = uniqBy(users, function (e: any) {
          return e.email;
        });
      }
    });

    //REMOVING DEPLICATE MOBILES FROM FRONTEND
    users = uniqBy(users, function (e: any) {
      return e.mobile;
    });

    //REMOVING DUPLICATE EMPLOYEE ID FROM FRONTEND
    users = uniqBy(users, function (e: any) {
      return e.employeeId;
    });

    let roles = await Role.find({}, "-_id _id").lean();

    let rolesArr: any = [];
    roles.forEach((role) => {
      rolesArr.push(role._id.toString());
    });

    //FILTERS FOR ROLE IF ANY USER DONT HAVE ROLE OR INVALID ROLE
    users = users.filter((element: any) => rolesArr.includes(element.role));

    let allDepartments = await Department.find(
      { hospital: hospital, deleted: false },
      "-_id _id"
    ).lean();

    let departmentArr: any = [];
    allDepartments.forEach((department) => {
      departmentArr.push(department._id.toString());
    });

    //FILTERS FOR DEPARTMENT IF ANY USER DONT HAVE DEPARTMENT OR INVALID DEPARTMENT
    users = users.filter((element: any) =>
      departmentArr.includes(element.department)
    );

    let sortedUsers: any = [];
    let error: any = [];
    console.log("userss", users);
    forEach(users, (user) => {
      let formattedMobile: any = getFormattedMobile(
        user.mobile,
        user.regionCode || user.countryCode
      );

      if (!isDef(user.firstName) || isEmpty(user.firstName)) {
        error.push({
          message: "First name cannot be empty",
          mobile: user.mobile,
          countryCode: user.countryCode,
        });
      }
      if (!isDef(user.lastName) || isEmpty(user.lastName)) {
        error.push({
          message: "Last name cannot be empty",
          mobile: user.mobile,
          countryCode: user.countryCode,
        });
      }
      // if (isDef(user.email) && !isvalidEmail(user.email)) {
      //   error.push({
      //     message: "Invalid email",
      //     name: user.name,
      //     mobile: user.mobile,
      //     countryCode: user.countryCode,
      //   });
      // }

      // if (isDef(user.email) && isEmpty(user.email)) {
      //   error.push({
      //     message: "Email cannot be empty",
      //     name: user.name,
      //     mobile: user.mobile,
      //     countryCode: user.countryCode,
      //   });
      // }

      if (
        !isDef(formattedMobile.mobileRaw) ||
        isEmpty(formattedMobile.mobileRaw) ||
        !formattedMobile.valid
      ) {
        error.push({
          message: "Invalid mobile number",
          firstName: user.firstName,
          lastName: user.lastName,
          countryCode: user.countryCode,
        });
      }
      if (isDef(user.employeeId) && isEmpty(user.employeeId)) {
        error.push({
          message: "EmployeeId cannot be empty",
          firstName: user.firstName,
          lastName: user.lastName,
          mobile: user.mobile,
          countryCode: user.countryCode,
        });
      }

      if (isDef(user.countryCode) && isEmpty(user.countryCode)) {
        error.push({
          message: "countryCode cannot be empty",
          firstName: user.firstName,
          lastName: user.lastName,
          mobile: user.mobile,
        });
      }
      if (!isDef(user.gender) || isEmpty(user.gender)) {
        user.gender = "NA";
      }

      if (
        isDef(user.employeeId) &&
        !isEmpty(user.employeeId) &&
        isDef(user.firstName) &&
        !isEmpty(user.firstName) &&
        isDef(user.lastName) &&
        !isEmpty(user.lastName) &&
        isDef(user.email) &&
        !isEmpty(user.email) &&
        formattedMobile.valid &&
        isvalidEmail(user.email) &&
        isDef(user.role) &&
        !isEmpty(user.gender) &&
        !isEmpty(user.role) &&
        isDef(user.countryCode) &&
        !isEmpty(user.countryCode)
      ) {
        sortedUsers.push({
          employeeId: user.employeeId,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          gender: user.gender,
          department: user.department,
          rawMobile: user.rawMobile,
          countryCode: user.countryCode,
          regionCode: user.regionCode,
          type: user.type,
          mobile: formattedMobile.mobile,
          hospital: hospital,
        });
      }

      if (
        isDef(user.employeeId) &&
        !isEmpty(user.employeeId) &&
        isDef(user.firstName) &&
        !isEmpty(user.firstName) &&
        isDef(user.lastName) &&
        !isEmpty(user.lastName) &&
        formattedMobile.valid &&
        isDef(user.role) &&
        !isEmpty(user.gender) &&
        !isEmpty(user.role) &&
        isDef(user.countryCode) &&
        !isEmpty(user.countryCode) &&
        !user.email
      ) {
        sortedUsers.push({
          employeeId: user.employeeId,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
          department: user.department,
          rawMobile: user.rawMobile,
          countryCode: user.countryCode,
          regionCode: user.regionCode,
          type: user.type,
          mobile: formattedMobile.mobile,
          hospital: hospital,
        });
      }
    });

    return { sortedUsers, error };
  } catch (error: any) {
    throw Boom.boomify(error);
  }
};

export { bulkUploadUsersFn };
