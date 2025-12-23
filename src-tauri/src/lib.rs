use walkdir::WalkDir;
use serde::{Serialize, Deserialize};
use std::env;
use std::fs;
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[derive(Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ObjectType {
    File,
    Folder,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Object {
    pub path: String,
    pub name: String,
    pub object_type: ObjectType,
    pub relevance: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modified: Option<String>,
}

pub struct PaginationOptions {
    limit: usize,
    offset: usize,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SidebarItem {
    pub name: String,
    pub path: String,
}

#[tauri::command]
fn get_sidebar_items() -> Vec<SidebarItem> {
    let home_dir = env::var("HOME").unwrap_or_else(|_| "/".to_string());

    // Build paths for common macOS locations
    let mut locations = vec![
        SidebarItem { name: "Home".to_string(), path: home_dir.clone() },
        SidebarItem { name: "Desktop".to_string(), path: format!("{}/Desktop", home_dir) },
        SidebarItem { name: "Documents".to_string(), path: format!("{}/Documents", home_dir) },
        SidebarItem { name: "Downloads".to_string(), path: format!("{}/Downloads", home_dir) },
        SidebarItem { name: "Applications".to_string(), path: "/Applications".to_string() },
        SidebarItem { name: "Music".to_string(), path: format!("{}/Music", home_dir) },
        SidebarItem { name: "Pictures".to_string(), path: format!("{}/Pictures", home_dir) },
        SidebarItem { name: "Movies".to_string(), path: format!("{}/Movies", home_dir) },
    ];

    // Check for optional locations
    let dropbox_path = format!("{}/Dropbox", home_dir);
    let icloud_path = format!("{}/Library/Mobile Documents/com~apple~CloudDocs", home_dir);

    if Path::new(&dropbox_path).exists() {
        locations.push(SidebarItem { name: "Dropbox".to_string(), path: dropbox_path });
    }

    if Path::new(&icloud_path).exists() {
        locations.push(SidebarItem { name: "iCloud Drive".to_string(), path: icloud_path });
    }

    locations
}



#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn list_directory(path: &str, search_query: Option<&str>) -> Result<Vec<Object>, String> {
    grab_objects(path, search_query, false)
}

#[tauri::command]
fn create_folder(path: &str, name: &str) -> Result<String, String> {
    let full_path = format!("{}/{}", path, name);
    fs::create_dir(&full_path)
        .map(|_| full_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn create_file(path: &str, name: &str) -> Result<String, String> {
    let full_path = format!("{}/{}", path, name);
    fs::File::create(&full_path)
        .map(|_| full_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn rename_item(old_path: &str, new_name: &str) -> Result<String, String> {
    let path = Path::new(old_path);
    let parent = path.parent().ok_or("Invalid path")?;
    let new_path = parent.join(new_name);
    
    fs::rename(old_path, &new_path)
        .map(|_| new_path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_item(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if p.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn move_item(source: &str, destination: &str) -> Result<String, String> {
    let src = Path::new(source);
    let file_name = src.file_name().ok_or("Invalid source path")?;
    let dest_path = Path::new(destination).join(file_name);
    
    fs::rename(source, &dest_path)
        .map(|_| dest_path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn copy_item(source: &str, destination: &str) -> Result<String, String> {
    let src = Path::new(source);
    let file_name = src.file_name().ok_or("Invalid source path")?;
    let dest_path = Path::new(destination).join(file_name);
    
    if src.is_dir() {
        copy_dir_recursive(src, &dest_path)?;
    } else {
        fs::copy(source, &dest_path).map_err(|e| e.to_string())?;
    }
    
    Ok(dest_path.to_string_lossy().to_string())
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;
    
    for entry in fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

fn grab_objects(path: &str, search_query: Option<&str>, folder_only: bool) -> Result<Vec<Object>, String> {
    let mut objects: Vec<Object> = Vec::new();

    for entry in WalkDir::new(path)
        .max_depth(1)
        .min_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path_buf = entry.path();
        let name = path_buf
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        let object_type = if path_buf.is_dir() {
            ObjectType::Folder
        } else {
            ObjectType::File
        };

        let metadata = fs::metadata(&path_buf).ok();
        let size = metadata.as_ref().and_then(|m| if m.is_file() { Some(m.len()) } else { None });
        let modified = metadata.as_ref().and_then(|m| {
            m.modified().ok().and_then(|t| {
                t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs().to_string())
            })
        });

        let relevance = match search_query {
            Some(query) if !query.is_empty() => {
                let name_lower = name.to_lowercase();
                let query_lower = query.to_lowercase();

                if name_lower == query_lower {
                    0
                } else if name_lower.contains(&query_lower) {
                    1
                } else if name_lower.starts_with(&query_lower) {
                    2
                } else {
                    let dist = distance(&name_lower, &query_lower);
                    let threshold = (query_lower.len() / 2) + 2;
                    if dist <= threshold {
                        3 + dist
                    } else {
                        usize::MAX
                    }
                }
            }
            _ => 0,
        };

        match object_type {
            ObjectType::File => {
                if !folder_only {
                    objects.push(Object {
                        path: path_buf.to_string_lossy().into_owned(),
                        name,
                        object_type,
                        relevance,
                        size,
                        modified,
                    });
                }
            }
            ObjectType::Folder => {
                objects.push(Object {
                    path: path_buf.to_string_lossy().into_owned(),
                    name,
                    object_type,
                    relevance,
                    size: None,
                    modified,
                });
            }
        }
    }

    if let Some(query) = search_query {
        if !query.is_empty() {
            objects.retain(|obj| obj.relevance != usize::MAX);
            objects.sort_by(|a, b| a.relevance.cmp(&b.relevance));
        }
    }

    Ok(objects)
}

fn distance(a: &str, b: &str) -> usize {
    let mut result = 0;

    /* Shortcut optimizations / degenerate cases. */
    if a == b {
        return result;
    }

    let length_a = a.chars().count();
    let length_b = b.chars().count();

    if length_a == 0 {
        return length_b;
    }

    if length_b == 0 {
        return length_a;
    }

    /* Initialize the vector.
     *
     * This is why it’s fast, normally a matrix is used,
     * here we use a single vector. */
    let mut cache: Vec<usize> = (1..).take(length_a).collect();

    /* Loop. */
    for (index_b, code_b) in b.chars().enumerate() {
        result = index_b;
        let mut distance_a = index_b;

        for (index_a, code_a) in a.chars().enumerate() {
            let distance_b = if code_a == code_b {
                distance_a
            } else {
                distance_a + 1
            };

            distance_a = cache[index_a];

            result = if distance_a > result {
                if distance_b > result {
                    result + 1
                } else {
                    distance_b
                }
            } else if distance_b > distance_a {
                distance_a + 1
            } else {
                distance_b
            };

            cache[index_a] = result;
        }
    }

    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_drag::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_sidebar_items,
            list_directory,
            create_folder,
            create_file,
            rename_item,
            delete_item,
            move_item,
            copy_item
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
