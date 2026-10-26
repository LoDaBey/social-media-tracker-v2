CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255),
  location VARCHAR(255),
  profile_picture VARCHAR(255),
  birthday VARCHAR(255),
  is_active BOOLEAN DEFAULT false,
  projects TEXT[],
  country VARCHAR(255),
  department VARCHAR(255),
  usercategory VARCHAR(255),
  work_start_time TIME,
  work_end_time TIME,
  balance integer NOT NULL DEFAULT 7,
  weekend_day VARCHAR(20) DEFAULT 'Friday',
  is_worker BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE social_media_accounts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  country VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  acc_category VARCHAR(100) NOT NULL,
  acc_state VARCHAR(100),
  acc_name VARCHAR(100) NOT NULL,
  acc_bio VARCHAR(500) NOT NULL,
  acc_url VARCHAR(2083) NOT NULL,
  acc_username VARCHAR(100) NOT NULL,
  acc_email VARCHAR(255) NOT NULL,
  acc_password_hash TEXT NOT NULL,
  acc_mobile VARCHAR(20),
  RSS VARCHAR(2083),
  Personal BOOLEAN NOT NULL DEFAULT FALSE,
  Umberlla BOOLEAN NOT NULL DEFAULT FALSE,
  Blogs BOOLEAN NOT NULL DEFAULT FALSE,
  Golden BOOLEAN NOT NULL DEFAULT FALSE,
  Native BOOLEAN NOT NULL DEFAULT FALSE,
  Language1 VARCHAR(255) NOT NULL DEFAULT 'English',
  Language2 VARCHAR(255) NOT NULL DEFAULT 'English',
  dropbox VARCHAR(2083),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  direction VARCHAR(50) NOT NULL DEFAULT 'GH-G',
  spare_acc BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE (region, country, acc_url, platform, acc_category, acc_state, direction)
);



CREATE TABLE growth_users (
  id SERIAL PRIMARY KEY,
  acc_region VARCHAR(100) NOT NULL,
  acc_country VARCHAR(100) NOT NULL,
  acc_url VARCHAR(2083) NOT NULL,
  acc_platform VARCHAR(50) NOT NULL,
  acc_handler INT NOT NULL,
  acc_category VARCHAR(100) NOT NULL, 
  acc_state VARCHAR(100) NOT NULL,    
  acc_fs INT DEFAULT 0,             
  acc_fw INT DEFAULT 0,                
  acc_vs INT DEFAULT 0,               
  acc_karma INT DEFAULT 0,            
  acc_retweet INT DEFAULT 0,           
  acc_post INT DEFAULT 0,             
  acc_likes INT DEFAULT 0,            
  acc_imp INT DEFAULT 0,             
  acc_comments INT DEFAULT 0,        
  acc_friends INT DEFAULT 0,          
  acc_pins INT DEFAULT 0,            
  acc_articles INT DEFAULT 0,         
  acc_votes INT DEFAULT 0,
  tl_approval VARCHAR(20) DEFAULT 'pending', 
  direction VARCHAR(50) NOT NULL DEFAULT 'GH-G',
  smd_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (acc_region, acc_country, acc_url, acc_platform, acc_category, acc_state, direction) REFERENCES social_media_accounts (region, country, acc_url, platform, acc_category, acc_state, direction) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (acc_handler) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (smd_id) REFERENCES social_media_accounts (id) ON UPDATE CASCADE ON DELETE CASCADE

);


CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,    
    screenshot TEXT NOT NULL,         
    description TEXT NOT NULL,         
    platform VARCHAR(50) NOT NULL,     
    direction VARCHAR(50) NOT NULL, 
    country VARCHAR(100) NOT NULL,      
    account_name VARCHAR(100) NOT NULL, 
    account_url VARCHAR(2083) NOT NULL,
    user_projects TEXT[] NOT NULL,
    date DATE NOT NULL,                 
    likes INT DEFAULT 0,               
    shares INT DEFAULT 0,              
    comments INT DEFAULT 0,   
    views INT DEFAULT 0,         
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    message TEXT NOT NULL,
    tl_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    direct BOOLEAN DEFAULT FALSE,
    role VARCHAR(255) NOT NULL DEFAULT '',
    category VARCHAR(50) DEFAULT NULL,
    action_route TEXT DEFAULT NULL,
    metadata JSONB DEFAULT NULL
);


CREATE TABLE JoinedCompetitions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    Achievement_URL TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    user_projects TEXT[] NOT NULL,
    user_name TEXT NOT NULL DEFAULT '',
    type varchar(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reports (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL DEFAULT '',
    reportType TEXT NOT NULL DEFAULT '',
    user_name TEXT NOT NULL DEFAULT '',
    user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_projects TEXT[] NOT NULL,
    url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Archives (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL DEFAULT 0,
    archive_name TEXT NOT NULL DEFAULT '',
    archive_description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE Support_Tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(100) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    accountUrl TEXT NOT NULL,
    accountName VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    projects TEXT[] NOT NULL,
    role VARCHAR(100) NOT NULL,
    status VARCHAR(100) NOT NULL DEFAULT TRUE,
    img_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  department VARCHAR(255) NOT NULL,
  userName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  leave_type VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hrstatus VARCHAR(255) DEFAULT 'pending', 
  teamleadersstatus VARCHAR(255) DEFAULT 'pending',
  projects TEXT[] NOT NULL,
  balance integer NOT NULL DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  total_working_hours DECIMAL(4,2),
  status VARCHAR(50) DEFAULT 'present', -- present, late, early_leave, absent
  late_minutes INTEGER DEFAULT 0,
  early_leave_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- HR Actions table for tracking attendance violations and actions
CREATE TABLE hr_actions (
  id SERIAL PRIMARY KEY,
  attendance_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- warning, deduction, clarification_request
  details TEXT,
  deduction_amount DECIMAL(10,2) DEFAULT 0,
  applied_by INTEGER NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (applied_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);


 CREATE TABLE IF NOT EXISTS account_swap_requests (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
    current_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requesting_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    UNIQUE(account_id, current_user_id, target_user_id, requesting_user_id, status)
  );
  

-- Add hr_notes column to attendance table if it doesn't exist
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS hr_notes TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS auto_marked_absent BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS absence_notification_sent BOOLEAN DEFAULT FALSE;


-- Action logs table for monitoring POST, PUT, DELETE actions across all dashboards
CREATE TABLE IF NOT EXISTS action_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(255),
  action VARCHAR(10) NOT NULL CHECK (action IN ('POST', 'PUT', 'PATCH', 'DELETE')),
  endpoint VARCHAR(500) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  source VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_action ON action_logs(action);

INSERT INTO users (username, location, phone_number, email, password, role, birthday, country, projects) 
VALUES ('Admin', 'Egypt', '123123', 'admin1@alpha.com', '123', 'Admin', '01/01/2025', 'Egypt', '{uae}') 
RETURNING *;

