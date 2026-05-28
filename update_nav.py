import os

base = r'C:\Workspace\dance-organization'

# === 1. Update Header.tsx ===
header_path = os.path.join(base, 'frontend', 'src', 'components', 'layout', 'Header.tsx')
with open(header_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_until_closing_div = False
in_desktop_right = False
added_login_button = False
added_login_to_mobile = False
skipped_news_link = False

i = 0
while i < len(lines):
    line = lines[i]
    
    # Skip the desktop News link (lines 71-79)
    if "href={href('/news')}" in line and '<Link' in lines[i-1]:
        skipped_news_link = True
        # Skip this Link block: find matching closing </Link>
        i += 1
        while i < len(lines) and '</Link>' not in lines[i]:
            i += 1
        i += 1  # skip the closing </Link> line too
        continue
    
    # Skip the mobile News link (in mobile menu block)
    if line.strip() == "href={href('/news')}" and in_desktop_right is False and added_login_button is False:
        skipped_news_link = True
        i += 1
        while i < len(lines) and '<' not in lines[i].strip() and lines[i].strip() != '':
            i += 1
        if '</Link>' in lines[i]:
            i += 1
        continue
    
    # Add imports (first few lines): add LogIn import and Button import
    if i == 0 and "'use client';" in line:
        new_lines.append(line)
        i += 1
        continue
    
    # Replace the imports line with Menu, X, ChevronDown
    if 'import { Menu, X, ChevronDown }' in line:
        new_lines.append("import { Menu, X, ChevronDown, LogIn } from 'lucide-react';\n")
        i += 1
        # Add Button import after cn import
        while i < len(lines) and "from '@/lib/utils';" not in lines[i]:
            new_lines.append(lines[i])
            i += 1
        new_lines.append(lines[i])  # the cn import line
        i += 1
        new_lines.append("import { Button } from '@/components/ui/button';\n")
        continue
    
    # Desktop right sidebar: replace LanguageSwitcher-only div with LanguageSwitcher + Login
    if '<div className="hidden lg:flex items-center gap-4">' in line and added_login_button is False:
        new_lines.append('        <div className="hidden lg:flex items-center gap-4">\n')
        in_desktop_right = True
        i += 1
        continue
    
    # Skip the old closing div that was just wrapping LanguageSwitcher
    if in_desktop_right and '</div>' in line and not added_login_button:
        new_lines.append('          <LanguageSwitcher />\n')
        new_lines.append('          <Button variant="default" size="sm" asChild>\n')
        new_lines.append("            <Link href={href('/admin/login')}>Login</Link>\n")
        new_lines.append('          </Button>\n')
        new_lines.append('        </div>\n')
        added_login_button = True
        in_desktop_right = False
        i += 1
        continue
    
    # In mobile menu: before the LanguageSwitcher div at bottom, add Login link
    if '<LanguageSwitcher />' in line and added_login_to_mobile is False and 'pt-4 border-t' in lines[i-1]:
        new_lines.append('            </div>\n')
        i += 1
        new_lines.append("              <Link href={href('/admin/login')} className=\"flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md\">\n")
        new_lines.append('                <LogIn className="h-4 w-4" />\n')
        new_lines.append("                {t('admin.login.signIn')}\n")
        new_lines.append('              </Link>\n')
        new_lines.append("            <div className=\"pt-4 border-t border-border mt-4\">\n")
        added_login_to_mobile = True
        continue
    
    new_lines.append(line)
    i += 1

with open(header_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Header updated: skipped_news={skipped_news_link}, added_login_button={added_login_button}, added_login_to_mobile={added_login_to_mobile}")

# === 2. Update Footer.tsx ===
footer_path = os.path.join(base, 'frontend', 'src', 'components', 'layout', 'Footer.tsx')
with open(footer_path, 'r', encoding='utf-8') as f:
    footer_content = f.read()

# Remove the News and Admin Login li elements from quick links
# Find the pattern: after </li> of contact link until </ul>
contact_li_close = footer_content.find("                  {t('common.nav.contact')}\n                </Link>\n              </li>")
if contact_li_close > 0:
    # Find </ul> after contact li
    ul_idx = footer_content.find("</ul>", contact_li_close)
    if ul_idx > 0:
        # Keep everything up to and including the contact </li>, then close </ul>
        footer_content = footer_content[:ul_idx + len("</ul>")]
        # Re-insert </ul> at the end
        # Actually let me be more precise: keep everything before the extra li's
        footer_content = footer_content[:contact_li_close] + \
            "                  {t('common.nav.contact')}\n                </Link>\n              </li>\n            </ul>"
        
        with open(footer_path, 'w', encoding='utf-8') as f:
            f.write(footer_content)
        print("Footer updated: removed News and Admin Login")
    else:
        print("Footer: </ul> not found")
else:
    print("Footer: contact li not found")
