import sqlite3

def clean():
    conn = sqlite3.connect("kasauti.db")
    c = conn.cursor()
    # Delete mock calls and related checks
    c.execute("DELETE FROM checks WHERE call_id IN (SELECT id FROM calls WHERE bolna_execution_id LIKE 'mock_%' OR bolna_execution_id IS NULL)")
    c.execute("DELETE FROM calls WHERE bolna_execution_id LIKE 'mock_%' OR bolna_execution_id IS NULL")
    c.execute("DELETE FROM fixes")
    c.execute("DELETE FROM runs WHERE target_id NOT IN (SELECT id FROM targets WHERE bolna_agent_id = '74bbf2a4-6561-48de-aec3-aafc7153bcd7')")
    c.execute("DELETE FROM targets WHERE bolna_agent_id != '74bbf2a4-6561-48de-aec3-aafc7153bcd7'")
    conn.commit()

    print("Targets left:", c.execute("SELECT id, name, phone_number, bolna_agent_id FROM targets").fetchall())
    print("Runs left:", c.execute("SELECT id, suite_name, status FROM runs").fetchall())
    print("Calls left:", c.execute("SELECT count(*) FROM calls").fetchone()[0])
    print("Checks left:", c.execute("SELECT count(*) FROM checks").fetchone()[0])

if __name__ == "__main__":
    clean()
