# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
from __future__ import annotations

import logging
from typing import (
    TYPE_CHECKING,
    Callable,
)

from fsspec.implementations.local import LocalFileSystem

from airflow.compat.functools import cache
from airflow.providers_manager import ProvidersManager
from airflow.stats import Stats
from airflow.utils.module_loading import import_string

if TYPE_CHECKING:
    from fsspec import AbstractFileSystem

log = logging.getLogger(__name__)


def _file(_: str | None) -> LocalFileSystem:
    return LocalFileSystem()


# builtin supported filesystems
_BUILTIN_SCHEME_TO_FS: dict[str, Callable[[str | None], AbstractFileSystem]] = {
    "file": _file,
}


@cache
def _register_filesystems() -> dict[str, Callable[[str | None], AbstractFileSystem]]:
    scheme_to_fs = _BUILTIN_SCHEME_TO_FS.copy()
    with Stats.timer("airflow.io.load_filesystems") as timer:
        manager = ProvidersManager()
        for fs_module_name in manager.filesystem_module_names:
            fs_module = import_string(fs_module_name)
            for scheme in getattr(fs_module, "schemes", []):
                if scheme in scheme_to_fs:
                    log.warning("Overriding scheme %s for %s", scheme, fs_module_name)

                method = getattr(fs_module, "get_fs", None)
                if method is None:
                    raise ImportError(f"Filesystem {fs_module_name} does not have a get_fs method")
                scheme_to_fs[scheme] = method

    log.debug("loading filesystems from providers took %.3f seconds", timer.duration)
    return scheme_to_fs


def get_fs(scheme: str, conn_id: str | None = None) -> AbstractFileSystem:
    """
    Get a filesystem by scheme.

    :param scheme: the scheme to get the filesystem for
    :return: the filesystem method
    :param conn_id: the airflow connection id to use
    """
    filesystems = _register_filesystems()
    try:
        return filesystems[scheme](conn_id)
    except KeyError:
        raise ValueError(f"No filesystem registered for scheme {scheme}")


def has_fs(scheme: str) -> bool:
    """
    Check if a filesystem is available for a scheme.

    :param scheme: the scheme to check
    :return: True if a filesystem is available for the scheme
    """
    return scheme in _register_filesystems()
