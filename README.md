# React-Framework
Babylon Toolkit React Framework

To add submodule:
```
git submodule add https://github.com/MackeyK24/React-Framework.git src/babylon
git commit -m "Add React-Framework as babylon submodule"
```

To remove submodule:
```
git submodule deinit -f src/babylon
git rm -f src/babylon
rm -rf .git/modules/src/babylon
git commit -m "Remove bad babylon submodule"
```

Note: Once the submodule has been added, to update its best make sure any changes are backed up, then remove the submodule to clean. Then add the submodule again to get new updates.