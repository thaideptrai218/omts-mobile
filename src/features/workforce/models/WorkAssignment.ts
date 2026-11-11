/** Loại nhân viên trong ngày (BR-LABOR-01): lao động thời vụ tính giờ theo loại việc, nhân viên chính thức tính ngày công. */
export type EmployeeType = "SeasonalWorker" | "Staff";

/**
 * Một nhân viên trong ngày trên một bè (`AssignmentView`, LABOR-02 và LABOR-04). `id` là phân công đầu tiên của ngày, giữ
 * nguyên dù sau đó đổi việc; bè và loại việc là của lần đổi gần nhất. `complete`: đã có cả giờ vào và giờ ra (BR-LABOR-06).
 * `onLeave`: ngày này nhân viên đã được duyệt nghỉ (BR-LABOR-08). `message`, `messageCode` chỉ có trong trả lời của vào ca,
 * ra ca: MSG-GEN-05, hoặc MSG-LABOR-12 khi ra ca mà chưa có giờ vào.
 */
export type WorkRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string | null;
  zoneId: string;
  raftId: string | null;
  raftCode: string | null;
  jobTypeId: string | null;
  job: string;
  date: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  complete: boolean;
  onLeave: boolean;
  message?: string;
  messageCode?: string;
};

/**
 * Nhân viên để chọn khi phân công (`WorkEmployeeOption`): đang làm việc, có vùng làm việc trong vùng của người dùng.
 * `jobTypeIds` là các loại việc trong hồ sơ (LABOR-02 bước 5 xếp người làm được loại việc đã chọn lên trước);
 * `raftCode` là bè đã phân công trong ngày, nếu có; `checkedIn`: đã vào ca trong ngày.
 */
export type EmployeeOption = {
  id: string;
  name: string;
  onLeave: boolean;
  code: string | null;
  phoneNumber: string | null;
  type: EmployeeType;
  jobTypeIds: string[];
  raftCode: string | null;
  checkedIn: boolean;
};

/** LABOR-02.0: phân công từ hôm nay trở đi. `moveExisting` gửi lại sau khi người dùng đồng ý MSG-LABOR-06. */
export type AssignWorkRequest = {
  raftId: string;
  jobTypeId: string;
  date: string;
  employeeIds: string[];
  moveExisting: boolean;
};

/** LABOR-02.2: đổi bè hoặc loại việc của một phân công, trước khi nhân viên vào ca. */
export type EditAssignmentRequest = {
  raftId: string;
  jobTypeId: string;
};

/** LABOR-02.1: đổi việc cho đội trong hôm nay. */
export type ChangeCrewJobRequest = {
  raftId: string;
  jobTypeId: string;
  employeeIds: string[];
};
