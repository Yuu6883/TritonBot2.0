interface BaseCommand {
    verify: (this: import("./src/Bot"), message: import("discord.js").Message) => Promise<boolean>;
    run: (this: import("./src/Bot"), message: import("discord.js").Message) => Promise<boolean>;
};

interface UCSDCourse {
    UNIT_FROM:  number;
    UNIT_TO:    number;
    UNIT_INC:   number;
    SUBJ_CODE:  string;
    CRSE_CODE:  string;
    SECTIONS:   CourseSection[];
    PREREQ:     CoursePrereq[];
    RSTR:       CourseRestriction[];
    CATALOG: {
        CATALOG_DATA: string;
    }
}

interface CourseSection {
    END_MM_TIME:         number;
    SCTN_CPCTY_QTY:      number;
    LONG_DESC:           string;
    SCTN_ENRLT_QTY:      number;
    BEGIN_HH_TIME:       number;
    SECTION_NUMBER:      number;
    SECTION_START_DATE:  string;
    STP_ENRLT_FLAG:      string;
    SECTION_END_DATE:    string;
    COUNT_ON_WAITLIST:   number;
    PRIMARY_INSTR_FLAG:  string;
    BEFORE_DESC:         string;
    ROOM_CODE:           string;
    END_HH_TIME:         number;
    START_DATE:          string;
    DAY_CODE:            number;
    BEGIN_MM_TIME:       number;
    PERSON_FULL_NAME:    string;
    FK_SPM_SPCL_MTG_CD:  string;
    PRINT_FLAG:          string;
    BLDG_CODE:           string;
    FK_SST_SCTN_STATCD:  string;
    FK_CDI_INSTR_TYPE:   string;
    SECT_CODE:           string;
    AVAIL_SEAT:          number;
}

interface CoursePrereq {
    SUBJECT_CODE:  string;
    PREREQ_SEQ_ID: string;
    CRSE_TITLE:    string;
    COURSE_CODE:   string;
    GRADE_SEQ_ID:  string;
    TYPE:          string;
}

interface CourseRestriction {
    CRSE_REGIS_TYPE_CD: string;
    CRSE_REGIS_FLAG:    string;
    CRSE_REGIS_CODE:    string;
}