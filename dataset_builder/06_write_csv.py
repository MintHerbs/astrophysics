"""Write dataframes to CSV, retrying if the target is locked (e.g. open in
Excel) so a long query isn't lost to a transient file lock."""

import time


def safe_to_csv(df, path, retries=30, wait=3):
    """Write df to path; retry on PermissionError, then let it surface."""
    for attempt in range(retries):
        try:
            df.to_csv(path, index=False)
            return
        except PermissionError:
            if attempt == 0:
                print(f"\n  >>> '{path}' is LOCKED (is it open in Excel?). "
                      f"Please close it; retrying for ~{retries * wait}s ...")
            time.sleep(wait)
    df.to_csv(path, index=False)
