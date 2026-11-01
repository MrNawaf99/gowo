export const getTeacherId = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("teacherId") || "";
  }
  return "";
};

export const getStudentId = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("studentId") || "";
  }
  return "";
};

export const getStudentName = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("studentName") || "";
  }
  return "";
};

export const isTeacherAuthenticated = (): boolean => {
  return !!getTeacherId();
};

export const isStudentAuthenticated = (): boolean => {
  return !!getStudentId();
};

// DEV_AUTH object for backwards compatibility
export const DEV_AUTH = {
  get currentTeacherId() {
    return getTeacherId();
  },
  get currentStudentId() {
    return getStudentId();
  },
};
